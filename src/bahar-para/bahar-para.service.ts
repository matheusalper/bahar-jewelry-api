import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaharParaTransaction } from './entities/bahar-para-transaction.entity';
import { User } from '../users/entities/user.entity';
import { Order, PaymentStatus } from '../orders/entities/order.entity';
import { SiteSettingsService } from '../site-settings/site-settings.service';

// Admin panelden yönetilen varsayılan ayarlar
const DEFAULTS = {
  isActive: true,
  firstOrderEarnRate: 0.5,      // %50 — ilk sipariş
  repeatOrderEarnRate: 0.1,     // %10 — sonraki siparişler
  validityDays: 365,            // 1 yıl geçerli
  allowUseOnSameOrder: false,   // Kazanılan para aynı siparişte kullanılamaz
  earnActivationStatus: 'on_payment', // 'on_order' | 'on_payment' | 'on_delivery'
};

export interface BaharParaSettings {
  isActive: boolean;
  firstOrderEarnRate: number;
  repeatOrderEarnRate: number;
  validityDays: number;
  allowUseOnSameOrder: boolean;
  earnActivationStatus: string;
  minimumCartTotal?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class BaharParaService {
  private readonly logger = new Logger(BaharParaService.name);

  constructor(
    @InjectRepository(BaharParaTransaction)
    private readonly txRepo: Repository<BaharParaTransaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly settingsService: SiteSettingsService,
  ) {}

  // ─── Ayarlar ──────────────────────────────────────────────────────────────

  async getSettings(): Promise<BaharParaSettings> {
    const s = await this.settingsService.getSettings();
    return { ...DEFAULTS, ...(s as any).baharParaSettings };
  }

  // ─── Kullanıcı bakiyesi ───────────────────────────────────────────────────

  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return 0;
    return Math.max(0, Number(user.baharParaBalance) || 0);
  }

  async getTransactions(userId: string) {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  // ─── Sepette kullanım validasyonu ─────────────────────────────────────────

  /** Sepet için maksimum kullanılabilir BaharPara'yı hesaplar */
  async validateSpend(userId: string, cartSubtotal: number, requestedAmount: number) {
    const settings = await this.getSettings();
    if (!settings.isActive) {
      throw new BadRequestException('BaharPara sistemi şu an aktif değil.');
    }
    const balance = await this.getBalance(userId);
    // Kural: BaharPara sepet toplamını aşamaz, bakiyeyi aşamaz
    const maxUsable = Math.min(balance, cartSubtotal);
    const actualAmount = Math.min(requestedAmount, maxUsable);

    if (actualAmount <= 0) return { applicable: 0, balance, maxUsable };
    return { applicable: Math.floor(actualAmount * 100) / 100, balance, maxUsable };
  }

  /** Checkout öncesi bakiye bilgisi ve tahmini kazanımı döndürür */
  async getCheckoutInfo(userId: string, cartSubtotal: number) {
    const settings = await this.getSettings();
    const balance = await this.getBalance(userId);
    const isFirst = await this.isFirstPaidOrder(userId);
    const earnRate = isFirst ? settings.firstOrderEarnRate : settings.repeatOrderEarnRate;
    const maxUsable = Math.min(balance, cartSubtotal);

    return {
      balance,
      maxUsable,
      isFirstOrder: isFirst,
      earnRate,
      estimatedEarn: Math.floor(cartSubtotal * earnRate * 100) / 100,
      isActive: settings.isActive,
    };
  }

  // ─── Sipariş işlemleri ────────────────────────────────────────────────────

  /** Checkout sırasında BaharPara kullanımını işle (bakiyeyi düş) */
  async processSpend(orderId: string, userId: string, requestedAmount: number, cartSubtotal: number) {
    const settings = await this.getSettings();
    if (!settings.isActive || requestedAmount <= 0) return 0;

    const { applicable } = await this.validateSpend(userId, cartSubtotal, requestedAmount);
    if (applicable <= 0) return 0;

    // Bakiyeyi düş
    await this.userRepo.decrement({ id: userId }, 'baharParaBalance', applicable);

    // Transaction kaydı
    const tx = this.txRepo.create({
      userId,
      orderId,
      type: 'spend',
      amount: -applicable,
      status: 'used',
      description: `#${orderId.slice(0, 8).toUpperCase()} siparişinde BaharPara kullanımı`,
    });
    await this.txRepo.save(tx);
    this.logger.log(`Kullanıcı ${userId} → ${applicable} TL BaharPara kullandı (sipariş: ${orderId.slice(0, 8)})`);
    return applicable;
  }

  /**
   * Ödeme onaylandığında BaharPara kazan.
   * Tetikleyiciler: card→ anında, bank_transfer→ admin onayında, cash→ teslimatta
   */
  async processEarn(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || !order.userId) return null;
    if (order.baharParaEarnedAt) {
      this.logger.warn(`Sipariş ${orderId.slice(0, 8)} için BaharPara zaten verilmiş`);
      return null;
    }

    const settings = await this.getSettings();
    if (!settings.isActive) return null;

    const isFirst = await this.isFirstPaidOrder(order.userId, orderId);
    const earnRate = isFirst ? settings.firstOrderEarnRate : settings.repeatOrderEarnRate;

    // Kazanım hesabı: BaharPara kullanılan tutar hariç, sadece nakit ödeme üzerinden
    const cartSubtotal = Number(order.cartSubtotal || order.totalPrice);
    const baharParaUsed = Number(order.baharParaUsed || 0);
    const earnBase = Math.max(0, cartSubtotal - baharParaUsed);
    const earned = Math.floor(earnBase * earnRate * 100) / 100;

    // Geçerlilik tarihi
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (settings.validityDays || 365));

    // Order güncelle
    order.baharParaEarnRate = earnRate;
    order.baharParaEarnBaseAmount = earnBase;
    order.baharParaEarned = earned;
    order.isFirstPaidOrder = isFirst;
    order.baharParaEarnedAt = new Date();
    await this.orderRepo.save(order);

    if (earned > 0) {
      // Kullanıcı bakiyesini artır
      await this.userRepo.increment({ id: order.userId }, 'baharParaBalance', earned);

      // Transaction kaydı
      const tx = this.txRepo.create({
        userId: order.userId,
        orderId,
        type: 'earn',
        amount: earned,
        status: 'active',
        expiresAt,
        description: `#${orderId.slice(0, 8).toUpperCase()} siparişinden BaharPara kazanımı (${isFirst ? 'İlk Sipariş' : 'Tekrar'} %${Math.round(earnRate * 100)})`,
      });
      await this.txRepo.save(tx);
      this.logger.log(`Kullanıcı ${order.userId} → ${earned} TL BaharPara kazandı (sipariş: ${orderId.slice(0, 8)}, ${isFirst ? 'ilk sipariş' : 'tekrar'})`);
    }

    return { earned, earnRate, earnBase, isFirst };
  }

  /** Sipariş iptal/iade → kazanılan BaharPara'yı geri al, kullanılanı iade et */
  async processCancellation(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || !order.userId) return;

    // 1. Kazanılan BaharPara'yı iptal et
    const earned = Number(order.baharParaEarned || 0);
    if (earned > 0 && order.baharParaEarnedAt) {
      await this.userRepo.decrement({ id: order.userId }, 'baharParaBalance', earned);
      const tx = this.txRepo.create({
        userId: order.userId,
        orderId,
        type: 'admin_adjustment',
        amount: -earned,
        status: 'cancelled',
        description: `#${orderId.slice(0, 8).toUpperCase()} sipariş iptali — kazanım geri alındı`,
      });
      await this.txRepo.save(tx);
      order.baharParaEarned = 0;
      order.baharParaEarnedAt = undefined;
      await this.orderRepo.save(order);
    }

    // 2. Kullanılan BaharPara'yı iade et
    const used = Number(order.baharParaUsed || 0);
    if (used > 0) {
      await this.userRepo.increment({ id: order.userId }, 'baharParaBalance', used);
      const tx = this.txRepo.create({
        userId: order.userId,
        orderId,
        type: 'refund',
        amount: used,
        status: 'active',
        description: `#${orderId.slice(0, 8).toUpperCase()} sipariş iptali — kullanılan BaharPara iadesi`,
      });
      await this.txRepo.save(tx);
    }

    this.logger.log(`Sipariş ${orderId.slice(0, 8)} iptali → ${earned} TL kazanım geri alındı, ${used} TL kullanım iade edildi`);
  }

  // ─── Admin işlemleri ──────────────────────────────────────────────────────

  async adminAdjustment(userId: string, amount: number, type: 'add' | 'remove', description: string, adminNote?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const absAmount = Math.abs(amount);
    if (type === 'remove') {
      const balance = Number(user.baharParaBalance || 0);
      if (balance < absAmount) throw new BadRequestException(`Kullanıcının yeterli bakiyesi yok (mevcut: ${balance} TL)`);
      await this.userRepo.decrement({ id: userId }, 'baharParaBalance', absAmount);
    } else {
      await this.userRepo.increment({ id: userId }, 'baharParaBalance', absAmount);
    }

    const tx = this.txRepo.create({
      userId,
      type: 'admin_adjustment',
      amount: type === 'add' ? absAmount : -absAmount,
      status: 'active',
      description: description || `Admin ${type === 'add' ? 'ekleme' : 'çıkarma'}: ${adminNote || ''}`,
    });
    await this.txRepo.save(tx);

    const updated = await this.userRepo.findOne({ where: { id: userId } });
    return { userId, newBalance: Number(updated?.baharParaBalance || 0), type, amount: absAmount };
  }

  // Admin: tüm kullanıcıların BaharPara özetini getir
  async adminGetAllBalances(page = 1, limit = 50) {
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      balance: Number(u.baharParaBalance || 0),
    }));
  }

  async adminGetUserTransactions(userId: string) {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Yardımcı ─────────────────────────────────────────────────────────────

  /** Kullanıcının daha önce ödemesi onaylanmış siparişi var mı? */
  async isFirstPaidOrder(userId: string, excludeOrderId?: string): Promise<boolean> {
    const qb = this.orderRepo.createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .andWhere('order.paymentStatus = :status', { status: PaymentStatus.PAID });
    if (excludeOrderId) qb.andWhere('order.id != :excludeId', { excludeId: excludeOrderId });
    const count = await qb.getCount();
    return count === 0;
  }
}
