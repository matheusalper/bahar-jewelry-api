import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Iyzico/Stripe'tan gelen ödeme sonucu bildirimi
  // POST /api/payment/webhook
  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }
}
