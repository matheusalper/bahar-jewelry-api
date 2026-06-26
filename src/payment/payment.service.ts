import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  // MVP: gerçek bir ödeme sağlayıcısı (Iyzico/PayTR) yerine her ödeme anında
  // başarılı sayılır. Faz 8'de gerçek entegrasyon burada eklenecek.
  async createPaymentIntent(orderId: string, amount: number) {
    return {
      success: true,
      transactionId: randomUUID(),
      orderId,
      amount,
      provider: 'mock',
    };
  }

  // Gerçek bir ödeme sağlayıcısı (örn. Iyzico) ödeme sonucunu bu uç noktaya bildirir.
  // payload örneği: { orderId, status: 'paid' | 'failed' }
  // NOT: Bu sadece ÖDEME durumunu günceller — sipariş (kargo/hazırlık) durumu ayrı yönetilir.
  async handleWebhook(payload: { orderId: string; status: 'paid' | 'failed' }) {
    const paymentStatus = payload.status === 'paid' ? PaymentStatus.PAID : PaymentStatus.FAILED;
    return this.ordersService.updatePaymentStatus(payload.orderId, paymentStatus);
  }
}
