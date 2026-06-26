import { IsObject, IsOptional } from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsObject()
  @IsOptional()
  banner?: Record<string, any>;

  @IsOptional()
  announcementBar?: any[];

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, any>;

  @IsObject()
  @IsOptional()
  contactInfo?: Record<string, any>;

  @IsObject()
  @IsOptional()
  paymentSettings?: Record<string, any>;
}
