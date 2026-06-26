import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // POST /api/payment/webhook — iyzico/PayTR geri bildirimi
  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }

  // POST /api/payment/init-card/:orderId — kart ödemesi başlat (API key kontrolü backend'de)
  @UseGuards(JwtAuthGuard)
  @Post('init-card/:orderId')
  initCardPayment(@Param('orderId') orderId: string, @Body('amount') amount: number) {
    return this.paymentService.initCardPayment(orderId, amount);
  }
}
