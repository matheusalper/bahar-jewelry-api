import {
  Column, CreateDateColumn, Entity,
  ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn, RelationId,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum ReviewStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  HIDDEN   = 'hidden',
}

export interface ReviewImage {
  url: string;
  alt: string;
  order: number;
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // İlişki üzerinden FK — @Column ile tekrarlanmıyor
  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @RelationId((r: Review) => r.product)
  productId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @RelationId((r: Review) => r.user)
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  orderId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', default: [] })
  images: ReviewImage[];

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  approvedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
