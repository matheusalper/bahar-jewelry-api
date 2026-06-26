import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  // GET /api/site-settings (herkese açık — frontend banner/duyuru/iletişim için bunu okur)
  @Get()
  getSettings() {
    return this.siteSettingsService.getSettings();
  }

  // PUT /api/site-settings (admin only — admin panelden kaydet)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put()
  updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    return this.siteSettingsService.updateSettings(dto);
  }
}
