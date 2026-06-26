import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus } from '../orders/entities/order.entity';
import { SiteSettingsService } from '../site-settings/site-settings.service';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly siteSettingsService: SiteSettingsService,
  ) {}

  // Kart ödemesi başlatma — API key yoksa hata ver, varsa sağlayıcıya yönlendir
  async initCardPayment(orderId: string, amount: number) {
    const settings = await this.siteSettingsService.getSettings();
    const ps = settings.paymentSettings || {};

    if (!ps.cardEnabled) {
      throw new BadRequestException('Kart ile ödeme şu an aktif değil. Lütfen başka bir yöntem seçin.');
    }

    if (!ps.apiKey || !ps.secretKey) {
      throw new BadRequestException(
        'Online ödeme şu anda aktif değil. Lütfen başka bir ödeme yöntemi seçin.',
      );
    }

    // GERÇEK ENTEGRASYON: ps.provider === 'iyzico' veya 'paytr'
    // şu an mock modunda her zaman başarılı sayar
    const provider = ps.provider || 'mock';
    if (provider === 'mock' || ps.testMode) {
      return {
        success: true,
        transactionId: randomUUID(),
        orderId,
        amount,
        provider,
        redirectUrl: null, // gerçek entegrasyonda ödeme sayfası URL'si buraya gelecek
        testMode: true,
      };
    }

    // TODO: gerçek iyzico/PayTR entegrasyonu — API key backend'de güvenli şekilde tutulur
    throw new BadRequestException('Ödeme sağlayıcısı henüz yapılandırılmamış.');
  }

  // MVP finalizeOrder'dan çağrılan mock akış
  async createPaymentIntent(orderId: string, amount: number) {
    const settings = await this.siteSettingsService.getSettings();
    const ps = settings.paymentSettings || {};
    // Havale ve kapıda ödemede anında "başarılı" sayma — bunlar paymentStatus=pending kalacak
    return {
      success: true,
      transactionId: randomUUID(),
      orderId,
      amount,
      provider: ps.provider || 'mock',
    };
  }

  async handleWebhook(payload: { orderId: string; status: 'paid' | 'failed' }) {
    const paymentStatus = payload.status === 'paid' ? PaymentStatus.PAID : PaymentStatus.FAILED;
    return this.ordersService.updatePaymentStatus(payload.orderId, paymentStatus);
  }
}
