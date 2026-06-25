import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/orders/checkout
  @Post('checkout')
  checkout(@Body() dto: CheckoutDto, @Req() req: any) {
    return this.ordersService.checkout(req.user, dto);
  }

  // GET /api/orders/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // GET /api/orders  (giriş yapan kullanıcının siparişleri)
  @Get()
  findMine(@Req() req: any) {
    return this.ordersService.findByUser(req.user);
  }
}
