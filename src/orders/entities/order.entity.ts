import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

// Siparişin "nerede olduğu" — kargo/hazırlık süreci
export enum OrderStatus {
  PENDING = 'pending', // Yeni Sipariş
  PREPARING = 'preparing', // Hazırlanıyor
  SHIPPED = 'shipped', // Kargoya Verildi
  DELIVERED = 'delivered', // Teslim Edildi
  CANCELLED = 'cancelled', // İptal Edildi
  PAID = 'paid', // ESKİ DEĞER — artık yeni siparişlerde kullanılmıyor, geriye dönük uyumluluk için duruyor
}

// Ödemenin durumu — sipariş durumundan AYRI, çünkü "kargoya verildi ama ödeme iade edildi" gibi durumlar olabilir
export enum PaymentStatus {
  PENDING = 'pending', // Beklemede
  PAID = 'paid', // Ödendi
  FAILED = 'failed', // Başarısız
  REFUNDED = 'refunded', // İade Edildi
}

export enum CustomerType {
  GUEST = 'guest',
  REGISTERED = 'registered',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Üye siparişlerinde kullanıcı id'si; misafir siparişlerde boş kalır
  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'enum', enum: CustomerType, default: CustomerType.REGISTERED })
  customerType: CustomerType;

  // Misafir siparişlerde müşterinin yazdığı ad soyad (üye siparişlerinde boş kalabilir)
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
  paymentMethod: string; // 'card' | 'bank_transfer' | 'cash_on_delivery' | 'whatsapp'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
