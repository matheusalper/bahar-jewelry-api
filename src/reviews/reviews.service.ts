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
    @InjectRepository(Review)  private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)   private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async getProductReviews(productId: string, sort = 'newest') {
    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .where('r.productId = :productId', { productId })
      .andWhere('r.status = :status', { status: ReviewStatus.APPROVED });

    if (sort === 'highest')     qb.orderBy('r.rating', 'DESC');
    else if (sort === 'lowest') qb.orderBy('r.rating', 'ASC');
    else if (sort === 'photos') {
      qb.andWhere("jsonb_array_length(r.images) > 0");
      qb.orderBy('r.createdAt', 'DESC');
    } else {
      qb.orderBy('r.createdAt', 'DESC');
    }

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

  async getPendingReviewProducts(userId: string) {
    const deliveredOrders = await this.orderRepo.find({
      where: { userId, status: OrderStatus.DELIVERED },
      relations: ['items'],
    });

    const result: any[] = [];
    for (const order of deliveredOrders) {
      for (const item of order.items || []) {
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

  async createReview(
    userId: string,
    productId: string,
    dto: { rating: number | string; title?: string; comment?: string; orderId?: string; images?: any[] },
  ) {
    const rating = Number(dto.rating);

    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestException('Puan 1-5 arasında olmalıdır.');
    }
    if (!dto.comment?.trim()) {
      throw new BadRequestException('Yorum metni zorunludur.');
    }

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');

    // Teslim edilmiş siparişlerde bu ürün var mı?
    const deliveredOrders = await this.orderRepo.find({
      where: { userId, status: OrderStatus.DELIVERED },
      relations: ['items'],
    });

    let verifiedOrderId: string | null = null;

    for (const order of deliveredOrders) {
      const hasProduct = (order.items || []).some(i => i.productId === productId);
      if (hasProduct) {
        verifiedOrderId = order.id;
        break;
      }
    }

    if (!verifiedOrderId) {
      throw new ForbiddenException(
        'Bu ürüne yorum yapabilmek için satın almış ve teslim almış olmanız gerekiyor.',
      );
    }

    // Aynı sipariş+ürün için tekrar yorum var mı?
    const existing = await this.reviewRepo.findOne({
      where: { userId, productId, orderId: verifiedOrderId },
    });
    if (existing) {
      throw new BadRequestException('Bu ürün için zaten yorum yaptınız.');
    }

    const review = new Review();
    review.userId = userId;
    review.productId = productId;
    review.orderId = verifiedOrderId;
    review.rating = rating;
    review.title = (dto.title?.trim() || '') as string;
    review.comment = dto.comment.trim();
    review.images = [];
    review.status = ReviewStatus.PENDING;
    review.isVerifiedPurchase = true;

    // Fotoğrafları Supabase'e yükle — hata olursa yorumu yine kaydet
    try {
      const photos: any[] = (dto as any).photos || [];
      const SUPABASE_URL = process.env.SUPABASE_URL || '';
      const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';
      const BUCKET = process.env.SUPABASE_BUCKET || 'product-images';

      if (photos.length > 0 && SUPABASE_URL && SUPABASE_KEY) {
        const uploaded: { url: string; alt: string; order: number }[] = [];
        for (let i = 0; i < Math.min(photos.length, 4); i++) {
          try {
            const dataUrl: string = photos[i]?.dataUrl || '';
            if (!dataUrl.startsWith('data:image/')) continue;
            const commaIdx = dataUrl.indexOf(',');
            const meta = dataUrl.substring(0, commaIdx);
            const b64  = dataUrl.substring(commaIdx + 1);
            const mimeMatch = meta.match(/data:(image\/[a-z]+)/);
            if (!mimeMatch) continue;
            const mime = mimeMatch[1];
            const ext  = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
            const buf  = Buffer.from(b64, 'base64');
            const path = `reviews/${productId}/${Date.now()}_${i}.${ext}`;
            const res  = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
              method: 'POST',
              headers: { 'Content-Type': mime, apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
              body: buf as any,
            });
            if (res.ok) {
              uploaded.push({ url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`, alt: `Fotoğraf ${i+1}`, order: i });
            }
          } catch { /* sessiz */ }
        }
        review.images = uploaded;
      }
    } catch { /* fotoğraf yükleme başarısız — yorumu yine kaydet */ }

    return this.reviewRepo.save(review);
  }

  async adminGetAll(status?: string) {
    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.product', 'product')
      .orderBy('r.createdAt', 'DESC');

    if (status) qb.where('r.status = :status', { status });
    return qb.getMany();
  }

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

  async reject(reviewId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    const wasApproved = review.status === ReviewStatus.APPROVED;
    review.status = ReviewStatus.REJECTED;
    await this.reviewRepo.save(review);
    if (wasApproved) await this.updateProductRating(review.productId);
    return review;
  }

  async hide(reviewId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    const wasApproved = review.status === ReviewStatus.APPROVED;
    review.status = ReviewStatus.HIDDEN;
    await this.reviewRepo.save(review);
    if (wasApproved) await this.updateProductRating(review.productId);
    return review;
  }

  async delete(reviewId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    const wasApproved = review.status === ReviewStatus.APPROVED;
    await this.reviewRepo.remove(review);
    if (wasApproved) await this.updateProductRating(review.productId);
    return { deleted: true };
  }

  private async updateProductRating(productId: string) {
    const approved = await this.reviewRepo.find({
      where: { productId, status: ReviewStatus.APPROVED },
      select: ['rating'],
    });

    const count = approved.length;
    const breakdown: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let total = 0;

    for (const r of approved) {
      total += Number(r.rating);
      const key = String(Math.round(Number(r.rating)));
      if (breakdown[key] !== undefined) breakdown[key]++;
    }

    const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

    await this.productRepo.update(productId, {
      ratingAverage: average,
      ratingCount: count,
      ratingBreakdown: breakdown,
    });
  }
}
