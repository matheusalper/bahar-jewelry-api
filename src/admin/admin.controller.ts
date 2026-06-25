import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /api/admin/orders?page=1&limit=20
  @Get('orders')
  getAllOrders(@Query() query: Record<string, string>) {
    return this.adminService.getAllOrders(query);
  }

  // GET /api/admin/analytics
  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
