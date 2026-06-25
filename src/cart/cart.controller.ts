import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // GET /api/cart  (Authorization varsa kullanıcı sepeti, yoksa X-Cart-Session header'ı ile misafir sepeti)
  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(req);
  }

  // POST /api/cart/add  { productId, quantity }
  @Post('add')
  addItem(@Body() body: { productId: string; quantity: number }, @Req() req: any) {
    return this.cartService.addItem(req, body);
  }

  // POST /api/cart/remove  { productId }
  @Post('remove')
  removeItem(@Body() body: { productId: string }, @Req() req: any) {
    return this.cartService.removeItem(req, body.productId);
  }

  // DELETE /api/cart/clear
  @Delete('clear')
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(req);
  }

  // POST /api/cart/merge  { guestSessionId }  (giriş yaptıktan sonra misafir sepetini kullanıcı sepetine taşır)
  @UseGuards(JwtAuthGuard)
  @Post('merge')
  merge(@Body() body: { guestSessionId: string }, @Req() req: any) {
    return this.cartService.mergeGuestCart(body.guestSessionId, req.user.id);
  }
}
