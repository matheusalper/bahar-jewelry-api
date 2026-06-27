import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BankTransferVerificationService } from './bank-transfer-verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/bank-transfers')
export class BankTransfersController {
  constructor(private readonly verificationService: BankTransferVerificationService) {}

  // POST /api/admin/bank-transfers/check/:orderId — tek sipariş kontrol
  @Post('check/:orderId')
  checkOrder(@Param('orderId') orderId: string) {
    return this.verificationService.checkOrder(orderId);
  }

  // POST /api/admin/bank-transfers/check-all — tüm bekleyenler
  @Post('check-all')
  checkAll() {
    return this.verificationService.checkAllPending();
  }

  // POST /api/admin/bank-transfers/manual-approve/:orderId
  @Post('manual-approve/:orderId')
  manualApprove(
    @Param('orderId') orderId: string,
    @Body('adminNote') adminNote: string,
  ) {
    return this.verificationService.manualApprove(orderId, adminNote);
  }

  // POST /api/admin/bank-transfers/manual-reject/:orderId
  @Post('manual-reject/:orderId')
  manualReject(
    @Param('orderId') orderId: string,
    @Body('adminNote') adminNote: string,
  ) {
    return this.verificationService.manualReject(orderId, adminNote);
  }

  // GET /api/admin/bank-transfers/logs?orderId=...&limit=50
  @Get('logs')
  getLogs(
    @Query('orderId') orderId: string,
    @Query('limit') limit: string,
  ) {
    return this.verificationService.getLogs(orderId, limit ? parseInt(limit, 10) : 50);
  }
}
