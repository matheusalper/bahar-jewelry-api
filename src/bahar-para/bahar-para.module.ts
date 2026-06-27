import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaharParaTransaction } from './entities/bahar-para-transaction.entity';
import { BaharParaController } from './bahar-para.controller';
import { BaharParaService } from './bahar-para.service';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { SiteSettingsModule } from '../site-settings/site-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BaharParaTransaction, User, Order]),
    SiteSettingsModule,
  ],
  controllers: [BaharParaController],
  providers: [BaharParaService],
  exports: [BaharParaService],
})
export class BaharParaModule {}
