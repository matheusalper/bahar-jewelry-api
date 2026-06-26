import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus, CustomerType } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { PaymentService } from '../payment/payment.service';

interface CartLine {
  productId: string;
  quantity: number;
}

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

  // Stok kontrolü + toplam fiyat hesaplama — hem üye hem misafir checkout'ta ortak kullanılır
  private async validateAndPrice(cartItems: CartLine[]) {
    if (cartItems.length === 0) {
      throw new BadRequestException('Sepetiniz boş, sipariş oluşturulamadı');
    }
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
    const totalPrice = Math.round(
      cartItems.reduce((sum, item, i) => sum + Number(products[i].price) * item.quantity, 0) * 100,
    ) / 100;
    return { products, totalPrice };
  }

  private async finalizeOrder(order: Order, cartItems: CartLine[], products: any[]) {
    await this.orderItemRepo.save(
      cartItems.map((item, i) => {
        const sortedImages = (products[i].images || []).slice().sort((a: any, b: any) => a.order - b.order);
        const mainImage = sortedImages.find((img: any) => img.isMain)?.url || sortedImages[0]?.url || null;
        return this.orderItemRepo.create({
          order,
          productId: item.productId,
          productTitle: products[i].title,
          productImage: mainImage,
          quantity: item.quantity,
          price: products[i].price,
        });
      }),
    );

    // Stok düş
    await Promise.all(
      cartItems.map((item, i) =>
        this.productsService.update(products[i].id, { stock: products[i].stock - item.quantity }),
      ),
    );

    // Ödeme durumu ödeme yöntemine göre belirlenir:
    // - Kart (mock/gerçek): anında onaylı → PAID
    // - Havale: müşteri ödeme yaptım diyene kadar → PENDING
    // - Kapıda ödeme: teslimat anında → PENDING
    // - WhatsApp: manuel takip → PENDING
    const method = order.paymentMethod || '';
    if (method === 'card') {
      const payment = await this.paymentService.createPaymentIntent(order.id, order.totalPrice);
      order.paymentStatus = payment.success ? PaymentStatus.PAID : PaymentStatus.FAILED;
    } else if (method === 'bank_transfer') {
      order.paymentStatus = PaymentStatus.PENDING;
      order.status = OrderStatus.PAYMENT_WAITING;
    } else {
      order.paymentStatus = PaymentStatus.PENDING;
    }
    await this.orderRepo.save(order);

    const finalOrder = await this.orderRepo.findOne({ where: { id: order.id }, relations: ['items'] });
    return { ...finalOrder, paymentInfo: { method, bankTransferPending: method === 'bank_transfer' } };
  }

  // Üye (giriş yapmış) kullanıcı checkout
  async checkout(user: { id: string; email?: string }, dto: CheckoutDto) {
    const cartItems = await this.cartService.getRawItemsForUser(user.id);
    const { products, totalPrice } = await this.validateAndPrice(cartItems);

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        userId: user.id,
        customerType: CustomerType.REGISTERED,
        customerEmail: user.email,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod || 'card',
        totalPrice,
        status: OrderStatus.PENDING,
      }),
    );

    const result = await this.finalizeOrder(order, cartItems, products);
    await this.cartService.clearUserCart(user.id);
    return result;
  }

  // Misafir (giriş yapmamış) checkout — sepet, X-Cart-Session ile gelen misafir oturumundan okunur
  async guestCheckout(cartSessionId: string, dto: GuestCheckoutDto) {
    const cartItems = await this.cartService.getRawItemsForGuest(cartSessionId);
    const { products, totalPrice } = await this.validateAndPrice(cartItems);

    const fullAddress = `${dto.address}, ${dto.district}/${dto.city}`;

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        customerType: CustomerType.GUEST,
        customerName: dto.name,
        customerPhone: dto.phone,
        customerEmail: dto.email,
        city: dto.city,
        district: dto.district,
        shippingAddress: fullAddress,
        note: dto.note,
        paymentMethod: dto.paymentMethod || 'whatsapp',
        totalPrice,
        status: OrderStatus.PENDING,
      }),
    );

    const result = await this.finalizeOrder(order, cartItems, products);
    await this.cartService.clearGuestCart(cartSessionId);
    return result;
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

  // Admin panelden sipariş/ödeme durumu güncelleme
  async updateOrderStatus(orderId: string, data: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    bankTransferMatched?: boolean;
    bankTransactionId?: string;
  }) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    if (data.status) order.status = data.status;
    if (data.paymentStatus) order.paymentStatus = data.paymentStatus;
    if (data.bankTransferMatched !== undefined) {
      order.bankTransferMatched = data.bankTransferMatched;
      if (data.bankTransferMatched) order.bankMatchedAt = new Date();
    }
    if (data.bankTransactionId) order.bankTransactionId = data.bankTransactionId;
    return this.orderRepo.save(order);
  }

  // Geriye dönük uyumluluk
  async updateStatus(orderId: string, status: OrderStatus) {
    return this.updateOrderStatus(orderId, { status });
  }

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
    return this.updateOrderStatus(orderId, { paymentStatus });
  }

  // Müşteri "Ödeme Yaptım" butonuna bastı — havale bekleniyor durumuna geçer
  async customerPaymentDone(orderId: string, userId: string | null, customerPaymentNote: string) {
    const where: any = { id: orderId };
    const order = await this.orderRepo.findOne({ where, relations: ['items'] });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    // Güvenlik: sadece siparişin sahibi veya misafir (userId null) erişebilir
    if (userId && order.userId && order.userId !== userId) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    // Zaten onaylanmışsa tekrar işlem yapma
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Bu sipariş zaten ödenmiş olarak işaretlenmiş.');
    }

    order.paymentStatus = PaymentStatus.PENDING_VERIFICATION;
    order.status = OrderStatus.PAYMENT_WAITING;
    order.customerPaymentNote = customerPaymentNote || '';
    order.clickedPaymentDoneAt = new Date();
    return this.orderRepo.save(order);
  }
}
