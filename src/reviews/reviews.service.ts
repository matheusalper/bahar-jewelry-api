import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  // Ürünün onaylı yorumlarını getir
  async getProductReviews(productId: string, sort = 'newest') {
    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .where('r.productId = :productId', { productId })
      .andWhere('r.status = :status', { status: ReviewStatus.APPROVED });

    if (sort === 'highest') qb.orderBy('r.rating', 'DESC');
    else if (sort === 'lowest') qb.orderBy('r.rating', 'ASC');
    else if (sort === 'photos') qb.andWhere("r.images != '[]'").orderBy('r.createdAt', 'DESC');
    else qb.orderBy('r.createdAt', 'DESC');

    const reviews = await qb.getMany();
    return reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: r.images,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
      user: { name: r.user?.name || 'Müşteri', username: r.user?.username },
    }));
  }

  // Kullanıcının yorum yapabileceği ürünleri getir (teslim edilmiş, yorum yapılmamış)
  async getPendingReviewProducts(userId: string) {
    const deliveredOrders = await this.orderRepo.find({
      where: { userId, status: OrderStatus.DELIVERED },
      relations: ['items'],
    });

    const result: any[] = [];
    for (const order of deliveredOrders) {
      for (const item of order.items || []) {
        // Bu sipariş+ürün için yorum var mı?
        const existing = await this.reviewRepo.findOne({
          where: { userId, productId: item.productId, orderId: order.id },
        });
        if (!existing) {
          const product = await this.productRepo.findOne({ where: { id: item.productId } });
          if (product) {
            result.push({
              orderId: order.id,
              productId: item.productId,
              productTitle: item.productTitle || product.title,
              productImage: item.productImage,
              orderDate: order.createdAt,
            });
          }
        }
      }
    }
    return result;
  }

  // Kullanıcının kendi yorumları
  async getUserReviews(userId: string) {
    const reviews = await this.reviewRepo.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
    return reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      images: r.images,
      createdAt: r.createdAt,
      product: { id: r.product?.id, title: r.product?.title },
    }));
  }

  // Yorum gönder
  async createReview(
    userId: string,
    productId: string,
    dto: { rating: number; title?: string; comment?: string; orderId?: string; images?: any[] },
  ) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Puan 1-5 arasında olmalıdır.');
    }

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');

    // Satın alma doğrulaması — teslim edilmiş siparişlerde bu ürün var mı?
    const deliveredOrders = await this.orderRepo.find({
      where: { userId, status: OrderStatus.DELIVERED },
      relations: ['items'],
    });

    let isVerifiedPurchase = false;
    let verifiedOrderId = dto.orderId || null;

    for (const order of deliveredOrders) {
      const hasProduct = (order.items || []).some(i => i.productId === productId);
      if (hasProduct) {
        isVerifiedPurchase = true;
        if (!verifiedOrderId) verifiedOrderId = order.id;
        break;
      }
    }

    if (!isVerifiedPurchase) {
      throw new ForbiddenException(
        'Bu ürüne yorum yapabilmek için satın almış ve teslim almış olmanız gerekiyor.',
      );
    }

    // Aynı sipariş+ürün için tekrar yorum var mı?
    const existing = await this.reviewRepo.findOne({
      where: { userId, productId, ...(verifiedOrderId ? { orderId: verifiedOrderId } : {}) },
    });
    if (existing) {
      throw new BadRequestException('Bu ürün için zaten yorum yaptınız.');
    }

    const review = this.reviewRepo.create({
      userId,
      productId,
      orderId: verifiedOrderId ?? undefined,
      rating: Number(dto.rating),
      title: dto.title || undefined,
      comment: dto.comment || undefined,
      images: dto.images || [],
      status: ReviewStatus.PENDING,
      isVerifiedPurchase: true,
    });

    return this.reviewRepo.save(review);
  }

  // Admin: tüm yorumlar
  async adminGetAll(status?: string) {
    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.product', 'product')
      .orderBy('r.createdAt', 'DESC');

    if (status) qb.where('r.status = :status', { status });
    return qb.getMany();
  }

  // Admin: onayla
  async approve(reviewId: string, adminId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    review.status = ReviewStatus.APPROVED;
    review.approvedAt = new Date();
    review.approvedBy = adminId;
    await this.reviewRepo.save(review);
    await this.updateProductRating(review.productId);
    return review;
  }

  // Admin: reddet
  async reject(reviewId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    const wasApproved = review.status === ReviewStatus.APPROVED;
    review.status = ReviewStatus.REJECTED;
    await this.reviewRepo.save(review);
    if (wasApproved) await this.updateProductRating(review.productId);
    return review;
  }

  // Admin: gizle
  async hide(reviewId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    const wasApproved = review.status === ReviewStatus.APPROVED;
    review.status = ReviewStatus.HIDDEN;
    await this.reviewRepo.save(review);
    if (wasApproved) await this.updateProductRating(review.productId);
    return review;
  }

  // Admin: sil
  async delete(reviewId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    const wasApproved = review.status === ReviewStatus.APPROVED;
    await this.reviewRepo.remove(review);
    if (wasApproved) await this.updateProductRating(review.productId);
    return { deleted: true };
  }

  // Ürün puanını yeniden hesapla
  private async updateProductRating(productId: string) {
    const approved = await this.reviewRepo.find({
      where: { productId, status: ReviewStatus.APPROVED },
      select: ['rating'],
    });

    const count = approved.length;
    const breakdown: Record<string, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;

    for (const r of approved) {
      total += r.rating;
      const key = String(r.rating);
      breakdown[key] = (breakdown[key] || 0) + 1;
    }

    const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

    await this.productRepo.update(productId, {
      ratingAverage: average,
      ratingCount: count,
      ratingBreakdown: breakdown,
    });
  }
}
