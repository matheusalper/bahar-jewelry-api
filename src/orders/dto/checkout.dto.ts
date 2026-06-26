import { IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  shippingAddress: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
