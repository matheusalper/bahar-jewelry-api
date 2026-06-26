import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../../orders/entities/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  // Banka API eşleşmesi için
  @IsBoolean()
  @IsOptional()
  bankTransferMatched?: boolean;

  @IsString()
  @IsOptional()
  bankTransactionId?: string;
}
