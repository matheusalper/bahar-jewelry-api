import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/orders/checkout (üye, giriş gerekir)
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  checkout(@Body() dto: CheckoutDto, @Req() req: any) {
    return this.ordersService.checkout(req.user, dto);
  }

  // POST /api/orders/guest-checkout (misafir, giriş gerekmez)
  // İstek başlığında X-Cart-Session ile misafir sepet oturumu gönderilir
  @Post('guest-checkout')
  guestCheckout(@Body() dto: GuestCheckoutDto, @Headers('x-cart-session') cartSessionId: string) {
    if (!cartSessionId) {
      throw new BadRequestException('Sepet oturumu bulunamadı (X-Cart-Session header eksik)');
    }
    return this.ordersService.guestCheckout(cartSessionId, dto);
  }

  // GET /api/orders/:id
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // GET /api/orders  (giriş yapan kullanıcının siparişleri)
  @UseGuards(JwtAuthGuard)
  @Get()
  findMine(@Req() req: any) {
    return this.ordersService.findByUser(req.user);
  }
}
