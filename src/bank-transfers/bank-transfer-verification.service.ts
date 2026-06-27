import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankTransferLog } from './entities/bank-transfer-log.entity';
import { BankProviderFactory } from './bank-provider.factory';
import { BankTransaction } from './providers/bank-provider.interface';
import { Order, OrderStatus, PaymentStatus } from '../orders/entities/order.entity';

const SCORE = {
  AMOUNT_MATCH: 40,
  ORDER_ID_IN_DESC: 40,
  SENDER_NAME_MATCH: 15,
  PAYMENT_NOTE_MATCH: 15,
  DATE_AFTER_ORDER: 5,
  AUTO_APPROVE_THRESHOLD: 80,
  PARTIAL_THRESHOLD: 70,
};

interface MatchResult {
  tx: BankTransaction;
  score: number;
  breakdown: Record<string, number>;
}

@Injectable()
export class BankTransferVerificationService {
  private readonly logger = new Logger(BankTransferVerificationService.name);

  constructor(
    @InjectRepository(BankTransferLog)
    private readonly logRepo: Repository<BankTransferLog>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly providerFactory: BankProviderFactory,
  ) {}

  async checkOrder(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const provider = await this.providerFactory.getProvider();
    const fromDate = new Date(order.createdAt);
    fromDate.setHours(0, 0, 0, 0);

    let transactions: BankTransaction[] = [];
    try {
      transactions = await provider.getTransactions(fromDate);
    } catch (err) {
      const log = await this.saveLog(order, undefined, 'error', provider.name, String(err.message));
      return { matched: false, log };
    }

    const best = this.findBestMatch(order, transactions);
    return this.applyMatchResult(order, best, provider.name);
  }

  async checkAllPending() {
    const pendingOrders = await this.orderRepo.find({
      where: { paymentMethod: 'bank_transfer', paymentStatus: PaymentStatus.PENDING_VERIFICATION },
    });
    this.logger.log(`${pendingOrders.length} bekleyen havale siparişi kontrol ediliyor`);
    const results = await Promise.allSettled(
      pendingOrders.map(order => this.checkOrder(order.id)),
    );
    return {
      total: pendingOrders.length,
      results: results.map((r, i) => ({
        orderId: pendingOrders[i].id,
        status: r.status,
        value: r.status === 'fulfilled' ? r.value : undefined,
        error: r.status === 'rejected' ? String((r as any).reason?.message) : undefined,
      })),
    };
  }

  async manualApprove(orderId: string, adminNote?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    order.paymentStatus = PaymentStatus.PAID;
    order.status = OrderStatus.PENDING;
    order.bankTransferMatched = true;
    order.bankMatchedAt = new Date();
    await this.orderRepo.save(order);
    const log = this.logRepo.create({
      orderId,
      expectedAmount: Number(order.totalPrice),
      result: 'manual_approved',
      provider: 'manual',
      errorMessage: adminNote,
      matchScore: 100,
      scoreBreakdown: { manual: 100 },
    });
    await this.logRepo.save(log);
    this.logger.log(`Sipariş ${orderId} manuel onaylandı`);
    return { approved: true };
  }

  async manualReject(orderId: string, adminNote?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    order.paymentStatus = PaymentStatus.FAILED;
    order.status = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);
    const log = this.logRepo.create({
      orderId,
      expectedAmount: Number(order.totalPrice),
      result: 'manual_rejected',
      provider: 'manual',
      errorMessage: adminNote,
      matchScore: 0,
      scoreBreakdown: { manual: 0 },
    });
    await this.logRepo.save(log);
    this.logger.log(`Sipariş ${orderId} manuel reddedildi`);
    return { rejected: true };
  }

  async getLogs(orderId?: string, limit = 50) {
    const qb = this.logRepo.createQueryBuilder('log')
      .orderBy('log.checkedAt', 'DESC')
      .take(Math.min(limit, 200));
    if (orderId) qb.where('log.orderId = :orderId', { orderId });
    return qb.getMany();
  }

  // ── Matching engine ──────────────────────────────────────────────

  private findBestMatch(order: Order, transactions: BankTransaction[]): MatchResult | undefined {
    if (transactions.length === 0) return undefined;
    let best: MatchResult | undefined;
    for (const tx of transactions) {
      const { score, breakdown } = this.scoreTransaction(order, tx);
      if (!best || score > best.score) best = { tx, score, breakdown };
    }
    return best;
  }

  private scoreTransaction(order: Order, tx: BankTransaction): { score: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};
    let score = 0;

    const diff = Math.abs(tx.amount - Number(order.totalPrice));
    if (diff <= 1.0) { breakdown.amount = SCORE.AMOUNT_MATCH; score += SCORE.AMOUNT_MATCH; }
    else if (diff <= Number(order.totalPrice) * 0.02) { breakdown.amount = 20; score += 20; }
    else { breakdown.amount = 0; }

    const shortId = order.id.slice(0, 8).toUpperCase();
    const desc = (tx.description || '').toUpperCase();
    if (desc.includes(shortId)) { breakdown.orderId = SCORE.ORDER_ID_IN_DESC; score += SCORE.ORDER_ID_IN_DESC; }
    else { breakdown.orderId = 0; }

    const custName = (order.customerName || '').trim().toUpperCase();
    const sender = (tx.senderName || '').trim().toUpperCase();
    if (custName && sender && this.nameSimilarity(custName, sender) >= 0.75) { breakdown.senderName = SCORE.SENDER_NAME_MATCH; score += SCORE.SENDER_NAME_MATCH; }
    else { breakdown.senderName = 0; }

    const payNote = (order.customerPaymentNote || '').trim().toUpperCase();
    if (payNote && sender && this.nameSimilarity(payNote, sender) >= 0.7) { breakdown.paymentNote = SCORE.PAYMENT_NOTE_MATCH; score += SCORE.PAYMENT_NOTE_MATCH; }
    else { breakdown.paymentNote = 0; }

    if (tx.transactionDate >= new Date(order.createdAt)) { breakdown.date = SCORE.DATE_AFTER_ORDER; score += SCORE.DATE_AFTER_ORDER; }
    else { breakdown.date = 0; }

    return { score, breakdown };
  }

  private nameSimilarity(a: string, b: string): number {
    const wa = new Set(a.split(/\s+/).filter(Boolean));
    const wb = new Set(b.split(/\s+/).filter(Boolean));
    if (wa.size === 0 || wb.size === 0) return 0;
    const common = [...wa].filter(w => wb.has(w)).length;
    return common / Math.max(wa.size, wb.size);
  }

  private async applyMatchResult(order: Order, best: MatchResult | undefined, providerName: string) {
    if (!best) {
      const log = await this.saveLog(order, undefined, 'no_match', providerName);
      return { matched: false, score: 0, log };
    }
    const { tx, score, breakdown } = best;
    this.logger.log(`Sipariş ${order.id.slice(0, 8)} skor: ${score} TX: ${tx.transactionId}`);

    const alreadyUsed = await this.logRepo.findOne({ where: { transactionId: tx.transactionId, result: 'matched' } });
    if (alreadyUsed) {
      const log = await this.saveLog(order, tx, 'error', providerName, `TX ${tx.transactionId} zaten ${alreadyUsed.orderId} siparişine bağlı`, breakdown, score);
      return { matched: false, score, log };
    }

    if (score >= SCORE.AUTO_APPROVE_THRESHOLD) {
      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.PENDING;
      order.bankTransferMatched = true;
      order.bankMatchedAt = new Date();
      order.bankTransactionId = tx.transactionId;
      order.matchedSenderName = tx.senderName;
      order.matchedAmount = tx.amount;
      await this.orderRepo.save(order);
      const log = await this.saveLog(order, tx, 'matched', providerName, undefined, breakdown, score);
      this.logger.log(`Sipariş ${order.id.slice(0, 8)} OTOMATİK ONAYLANDI (skor: ${score})`);
      return { matched: true, autoApproved: true, score, log };
    } else if (score >= SCORE.PARTIAL_THRESHOLD) {
      const log = await this.saveLog(order, tx, 'partial_match', providerName, undefined, breakdown, score);
      this.logger.warn(`Sipariş ${order.id.slice(0, 8)} kısmi eşleşme — admin gerekli (skor: ${score})`);
      return { matched: false, partialMatch: true, score, log };
    } else {
      const log = await this.saveLog(order, tx, 'no_match', providerName, undefined, breakdown, score);
      return { matched: false, score, log };
    }
  }

  private async saveLog(
    order: Order,
    tx: BankTransaction | undefined,
    result: BankTransferLog['result'],
    provider: string,
    errorMessage?: string,
    scoreBreakdown?: Record<string, number>,
    matchScore?: number,
  ) {
    const log = this.logRepo.create({
      orderId: order.id,
      expectedAmount: Number(order.totalPrice),
      foundAmount: tx?.amount,
      senderName: tx?.senderName,
      description: tx?.description,
      transactionId: tx?.transactionId,
      result,
      provider,
      errorMessage,
      scoreBreakdown: scoreBreakdown ?? {},
      matchScore: matchScore ?? 0,
    });
    return this.logRepo.save(log);
  }
}
