import { Body, Controller, Get, Header, Put, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
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
  // GET /api/seo/sitemap.xml
  @Get('/seo/sitemap')
  @Header('Content-Type', 'application/xml')
  async getSitemap(@Res() res: Response) {
    const xml = await this.siteSettingsService.generateSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  }

  // GET /api/seo/robots
  @Get('/seo/robots')
  @Header('Content-Type', 'text/plain')
  async getRobots(@Res() res: Response) {
    const txt = await this.siteSettingsService.getRobotsTxt();
    res.set('Content-Type', 'text/plain');
    res.send(txt);
  }
}
