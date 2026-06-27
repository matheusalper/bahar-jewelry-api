import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankTransferLog } from './entities/bank-transfer-log.entity';
import { BankTransfersController } from './bank-transfers.controller';
import { BankTransferVerificationService } from './bank-transfer-verification.service';
import { BankProviderFactory } from './bank-provider.factory';
import { Order } from '../orders/entities/order.entity';
import { SiteSettingsModule } from '../site-settings/site-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankTransferLog, Order]),
    SiteSettingsModule,
  ],
  controllers: [BankTransfersController],
  providers: [BankTransferVerificationService, BankProviderFactory],
  exports: [BankTransferVerificationService],
})
export class BankTransfersModule {}
