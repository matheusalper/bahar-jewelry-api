import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../../orders/entities/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;
}
