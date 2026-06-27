import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CheckoutDto {
  @IsString()
  shippingAddress: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  // Kullanıcının uygulamak istediği BaharPara (backend gerçek değeri yeniden hesaplar)
  @IsNumber()
  @Min(0)
  @IsOptional()
  baharParaUsed?: number;
}
