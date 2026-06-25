import { IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  shippingAddress: string;

  // Faz 5'te ödeme yöntemi seçimi (mock / iyzico) buraya eklenecek
}
