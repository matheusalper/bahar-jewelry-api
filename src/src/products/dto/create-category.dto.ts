import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  slug?: string; // verilmezse name'den otomatik üretilir

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  showInMenu?: boolean;

  @IsBoolean()
  @IsOptional()
  showOnHomepage?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
