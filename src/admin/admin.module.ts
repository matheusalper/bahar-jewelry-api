import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product]), OrdersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
