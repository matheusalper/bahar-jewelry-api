import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrdersModule } from '../orders/orders.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';

@Module({
  imports: [forwardRef(() => OrdersModule), SiteSettingsModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
