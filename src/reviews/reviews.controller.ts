import {
  Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  getProductReviews(@Param('productId') productId: string, @Query('sort') sort: string) {
    return this.reviewsService.getProductReviews(productId, sort);
  }

  @UseGuards(JwtAuthGuard)
  @Post('products/:productId/reviews')
  createReview(@Param('productId') productId: string, @Body() dto: any, @Req() req: any) {
    return this.reviewsService.createReview(req.user.id, productId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/reviews')
  getMyReviews(@Req() req: any) {
    return this.reviewsService.getUserReviews(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/pending-reviews')
  getPendingReviews(@Req() req: any) {
    return this.reviewsService.getPendingReviewProducts(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin' as any)
  @Get('admin/reviews')
  adminGetAll(@Query('status') status: string) {
    return this.reviewsService.adminGetAll(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin' as any)
  @Post('admin/reviews/:id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.approve(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin' as any)
  @Post('admin/reviews/:id/reject')
  reject(@Param('id') id: string) {
    return this.reviewsService.reject(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin' as any)
  @Post('admin/reviews/:id/hide')
  hide(@Param('id') id: string) {
    return this.reviewsService.hide(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin' as any)
  @Delete('admin/reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.reviewsService.delete(id);
  }
}
