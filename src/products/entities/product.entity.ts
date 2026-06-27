import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';

export interface ProductImage {
  url: string;
  alt: string;
  order: number;
  isMain: boolean;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Ürün listeleme kartlarında kullanılabilecek kısa özet (opsiyonel)
  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // Doluysa ve price'tan kucukse urun "indirimde" sayilir (isSale, API yanitinda hesaplanir)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  sku: string;

  // En fazla 4 gorsel: { url, alt, order, isMain }
  @Column({ type: 'jsonb', default: [] })
  images: ProductImage[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isNew: boolean;

  @Column({ default: false })
  isBestSeller: boolean;

  // Yorum & Puanlama — admin onaylı yorumlardan otomatik güncellenir
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAverage: number;

  @Column({ default: 0 })
  ratingCount: number;

  @Column({ type: 'jsonb', default: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  ratingBreakdown: Record<string, number>;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
