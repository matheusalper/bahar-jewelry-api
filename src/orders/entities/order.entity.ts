import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',               // Yeni Sipariş
  PAYMENT_WAITING = 'payment_waiting', // Ödeme Bekleniyor (havale için)
  PREPARING = 'preparing',           // Hazırlanıyor
  SHIPPED = 'shipped',               // Kargoya Verildi
  DELIVERED = 'delivered',           // Teslim Edildi
  CANCELLED = 'cancelled',           // İptal Edildi
  PAID = 'paid',                     // ESKİ — geriye dönük uyumluluk
}

export enum PaymentStatus {
  PENDING = 'pending',                        // Beklemede
  PENDING_VERIFICATION = 'pending_verification', // Müşteri havale yaptım dedi, doğrulama bekliyor
  PAID = 'paid',                              // Ödendi
  FAILED = 'failed',                          // Başarısız
  REFUNDED = 'refunded',                      // İade Edildi
}

export enum CustomerType {
  GUEST = 'guest',
  REGISTERED = 'registered',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'enum', enum: CustomerType, default: CustomerType.REGISTERED })
  customerType: CustomerType;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  district: string;

  @Column({ type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  // Havale / EFT için — müşteri "Ödeme Yaptım" butonuna basınca dolar
  @Column({ type: 'text', nullable: true })
  customerPaymentNote: string;

  @Column({ type: 'timestamp', nullable: true })
  clickedPaymentDoneAt: Date;

  // Gelecekteki banka API otomatik eşleşme için
  @Column({ default: false })
  bankTransferMatched: boolean;

  @Column({ type: 'timestamp', nullable: true })
  bankMatchedAt: Date;

  @Column({ nullable: true })
  bankTransactionId: string;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
