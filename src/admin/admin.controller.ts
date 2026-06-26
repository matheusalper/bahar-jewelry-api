import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ordersService: OrdersService,
  ) {}

  // GET /api/admin/orders?page=1&limit=20
  @Get('orders')
  getAllOrders(@Query() query: Record<string, string>) {
    return this.adminService.getAllOrders(query);
  }

  // PUT /api/admin/orders/:id/status — sipariş ve/veya ödeme durumunu güncelle
  @Put('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, dto);
  }

  // GET /api/admin/analytics
  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
