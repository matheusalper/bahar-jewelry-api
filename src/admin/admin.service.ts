import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  // GET /api/admin/orders?page=1&limit=20
  async getAllOrders(query: Record<string, string> = {}) {
    const page = Math.max(parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(query.limit ?? '20', 10), 1), 100);

    const [items, total] = await this.orderRepo.findAndCount({
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // GET /api/admin/analytics
  async getAnalytics() {
    const totalOrders = await this.orderRepo.count();

    const revenueResult = await this.orderRepo
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalPrice), 0)', 'sum')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .getRawOne();
    const totalRevenue = Math.round(parseFloat(revenueResult.sum) * 100) / 100;

    const statusRows = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();
    const ordersByStatus = Object.fromEntries(
      statusRows.map((row) => [row.status, parseInt(row.count, 10)]),
    );

    const totalProducts = await this.productRepo.count();

    const lowStock = await this.productRepo
      .createQueryBuilder('product')
      .where('product.stock < :threshold', { threshold: LOW_STOCK_THRESHOLD })
      .select(['product.id', 'product.title', 'product.stock'])
      .getMany();

    return {
      totalOrders,
      totalRevenue,
      ordersByStatus,
      totalProducts,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStockProducts: lowStock,
    };
  }
}
