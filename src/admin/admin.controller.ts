import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentStatus } from '../orders/entities/order.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ordersService: OrdersService,
  ) {}

  // GET /api/admin/orders
  @Get('orders')
  getAllOrders(@Query() query: Record<string, string>) {
    return this.adminService.getAllOrders(query);
  }

  // GET /api/admin/orders/:id — sipariş detayı
  @Get('orders/:id')
  getOrderDetail(@Param('id') id: string) {
    return this.adminService.getOrderDetail(id);
  }

  // PUT /api/admin/orders/:id/status
  @Put('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, dto);
  }

  // DELETE /api/admin/orders/:id — siparişi sil
  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(id);
  }

  // POST /api/admin/orders/:id/approve-payment
  @Post('orders/:id/approve-payment')
  approvePayment(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.PENDING,
      bankTransferMatched: true,
    });
  }

  // POST /api/admin/orders/:id/reject-payment
  @Post('orders/:id/reject-payment')
  rejectPayment(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, {
      paymentStatus: PaymentStatus.FAILED,
      status: OrderStatus.CANCELLED,
    });
  }

  // GET /api/admin/users?search=...
  @Get('users')
  getAllUsers(@Query('search') search: string) {
    return this.adminService.getAllUsers(search);
  }

  // GET /api/admin/users/:id
  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  // GET /api/admin/analytics
  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
