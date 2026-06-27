import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AdminAdjustmentDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(['add', 'remove'])
  type: 'add' | 'remove';

  @IsString()
  @IsOptional()
  description?: string;
}

export class GetCheckoutInfoDto {
  @IsNumber()
  @Min(0)
  cartSubtotal: number;
}
