import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, PaymentStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

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

  async getOrderDetail(orderId: string) {
    return this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
  }

  // Tüm üyeleri listele — BaharPara formu için de kullanılır
  async getAllUsers(search?: string) {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.phone', 'user.baharParaBalance', 'user.role', 'user.createdAt'])
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      qb.where('LOWER(user.name) LIKE :q OR LOWER(user.email) LIKE :q', { q: `%${search.toLowerCase()}%` });
    }

    return qb.limit(100).getMany();
  }

  // Müşteri detay + sipariş geçmişi + en çok sipariş ettiği kategoriler
  async getUserDetail(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    const orders = await this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    const totalSpent = orders
      .filter(o => o.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, o) => sum + Number(o.cartSubtotal || o.totalPrice), 0);

    // Ürün bazlı sipariş sayısı (snapshot title'ından)
    const productFreq: Record<string, { title: string; count: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items || []) {
        const key = item.productTitle || item.productId;
        if (!productFreq[key]) productFreq[key] = { title: item.productTitle || key, count: 0, revenue: 0 };
        productFreq[key].count += item.quantity;
        productFreq[key].revenue += Number(item.price) * item.quantity;
      }
    }
    const topProducts = Object.values(productFreq)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, baharParaBalance: user.baharParaBalance, createdAt: user.createdAt },
      orders,
      stats: {
        totalOrders: orders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        paidOrders: orders.filter(o => o.paymentStatus === PaymentStatus.PAID).length,
      },
      topProducts,
    };
  }

  async getAnalytics() {
    const totalOrders = await this.orderRepo.count();

    const revenueResult = await this.orderRepo
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalPrice), 0)', 'sum')
      .where('order.paymentStatus = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
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

    const paymentStatusRows = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.paymentStatus', 'paymentStatus')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.paymentStatus')
      .getRawMany();
    const ordersByPaymentStatus = Object.fromEntries(
      paymentStatusRows.map((row) => [row.paymentStatus, parseInt(row.count, 10)]),
    );

    const totalProducts = await this.productRepo.count();
    const totalCustomers = await this.userRepo.count();

    const lowStock = await this.productRepo
      .createQueryBuilder('product')
      .where('product.stock < :threshold', { threshold: LOW_STOCK_THRESHOLD })
      .select(['product.id', 'product.title', 'product.stock'])
      .getMany();

    return { totalOrders, totalRevenue, ordersByStatus, ordersByPaymentStatus, totalProducts, totalCustomers, lowStockThreshold: LOW_STOCK_THRESHOLD, lowStockProducts: lowStock };
  }

  async deleteOrder(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new Error('Sipariş bulunamadı');
    await this.orderRepo.remove(order);
    return { deleted: true, id: orderId };
  }
}
