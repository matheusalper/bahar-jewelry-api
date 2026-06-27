import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BaharParaService } from './bahar-para.service';
import { AdminAdjustmentDto, GetCheckoutInfoDto } from './dto/bahar-para.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('bahar-para')
export class BaharParaController {
  constructor(private readonly service: BaharParaService) {}

  // ─── Kullanıcı uç noktaları ───────────────────────────────────────────────

  /** GET /api/bahar-para/me — Bakiye + işlem geçmişi */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyInfo(@Req() req: any) {
    const [balance, transactions, settings] = await Promise.all([
      this.service.getBalance(req.user.id),
      this.service.getTransactions(req.user.id),
      this.service.getSettings(),
    ]);
    return { balance, transactions, settings };
  }

  /** POST /api/bahar-para/checkout-info — Sepet için kazanım tahmini */
  @UseGuards(JwtAuthGuard)
  @Post('checkout-info')
  getCheckoutInfo(@Req() req: any, @Body() dto: GetCheckoutInfoDto) {
    return this.service.getCheckoutInfo(req.user.id, dto.cartSubtotal);
  }

  // ─── Admin uç noktaları ───────────────────────────────────────────────────

  /** GET /api/bahar-para/admin/users — Tüm kullanıcıların bakiyeleri */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/users')
  adminGetAllBalances(@Query('page') page: string, @Query('limit') limit: string) {
    return this.service.adminGetAllBalances(parseInt(page || '1', 10), parseInt(limit || '50', 10));
  }

  /** GET /api/bahar-para/admin/users/:userId/transactions */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/users/:userId/transactions')
  adminGetUserTransactions(@Param('userId') userId: string) {
    return this.service.adminGetUserTransactions(userId);
  }

  /** POST /api/bahar-para/admin/adjust — Manuel BaharPara ekle/çıkar */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/adjust')
  adminAdjust(@Body() dto: AdminAdjustmentDto) {
    return this.service.adminAdjustment(dto.userId, dto.amount, dto.type, dto.description || '');
  }

  /** POST /api/bahar-para/admin/earn/:orderId — Siparişe BaharPara ekle (admin tetiklemesi) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/earn/:orderId')
  adminTriggerEarn(@Param('orderId') orderId: string) {
    return this.service.processEarn(orderId);
  }
}
