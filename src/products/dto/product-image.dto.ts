import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class ProductImageDto {
  @IsString()
  @MinLength(1)
  url: string;

  @IsString()
  @IsOptional()
  alt?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isMain?: boolean;
}
