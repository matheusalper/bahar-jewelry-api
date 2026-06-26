import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  button1Text?: string;

  @IsString()
  @IsOptional()
  button1Link?: string;

  @IsString()
  @IsOptional()
  button2Text?: string;

  @IsString()
  @IsOptional()
  button2Link?: string;

  @IsString()
  @IsOptional()
  originalImage?: string;

  @IsString()
  @IsOptional()
  desktopImage?: string;

  @IsString()
  @IsOptional()
  tabletImage?: string;

  @IsString()
  @IsOptional()
  mobileImage?: string;

  @IsString()
  @IsOptional()
  thumbnailImage?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
