import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  // MVP: gerçek bir ödeme sağlayıcısı (Iyzico/Stripe) yerine her ödeme anında
  // başarılı sayılır. Faz 7 sonrası gerçek entegrasyon burada eklenecek.
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
  async handleWebhook(payload: { orderId: string; status: 'paid' | 'failed' }) {
    const status = payload.status === 'paid' ? OrderStatus.PAID : OrderStatus.CANCELLED;
    return this.ordersService.updateStatus(payload.orderId, status);
  }
}
