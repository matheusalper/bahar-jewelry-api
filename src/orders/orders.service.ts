import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  async checkout(user: { id: string; email?: string }, dto: CheckoutDto) {
    const cartItems = await this.cartService.getRawItemsForUser(user.id);
    if (cartItems.length === 0) {
      throw new BadRequestException('Sepetiniz boş, sipariş oluşturulamadı');
    }

    // 1) Stok kontrolü + rezervasyon (eksik stok varsa hiçbir şey kaydedilmeden hata döner)
    const products = await Promise.all(
      cartItems.map((item) => this.productsService.findById(item.productId)),
    );
    cartItems.forEach((item, i) => {
      if (products[i].stock < item.quantity) {
        throw new BadRequestException(
          `"${products[i].title}" için yeterli stok yok (stok: ${products[i].stock}, istenen: ${item.quantity})`,
        );
      }
    });

    // 2) Sipariş anındaki fiyatları snapshot olarak alıyoruz (ürün fiyatı sonradan değişse de sipariş kaydı sabit kalır)
    const totalPrice = Math.round(
      cartItems.reduce((sum, item, i) => sum + Number(products[i].price) * item.quantity, 0) * 100,
    ) / 100;

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        userId: user.id,
        customerEmail: user.email,
        shippingAddress: dto.shippingAddress,
        totalPrice,
        status: OrderStatus.PENDING,
      }),
    );

    const orderItems = await this.orderItemRepo.save(
      cartItems.map((item, i) =>
        this.orderItemRepo.create({
          order,
          productId: item.productId,
          quantity: item.quantity,
          price: products[i].price,
        }),
      ),
    );

    // 3) Stok düş
    await Promise.all(
      cartItems.map((item, i) =>
        this.productsService.update(products[i].id, { stock: products[i].stock - item.quantity }),
      ),
    );

    // 4) Ödeme (MVP: mock gateway anında onaylıyor)
    const payment = await this.paymentService.createPaymentIntent(order.id, totalPrice);
    if (payment.success) {
      order.status = OrderStatus.PAID;
      await this.orderRepo.save(order);
    }

    // 5) Sepeti temizle
    await this.cartService.clearUserCart(user.id);

    // Güncel hâliyle (ödeme sonrası status, items dahil) tekrar oku — stale veri dönmemesi için
    const finalOrder = await this.orderRepo.findOne({ where: { id: order.id }, relations: ['items'] });
    return { ...finalOrder, shippingAddress: dto.shippingAddress, payment };
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    return order;
  }

  async findByUser(user: { id: string }) {
    return this.orderRepo.find({
      where: { userId: user.id },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  // PaymentService webhook'tan sipariş durumunu güncellemek için bunu çağırır
  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    order.status = status;
    return this.orderRepo.save(order);
  }
}
