import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // örn: Kolye, Küpe, Bilezik, Yüzük, Set, Saç & Bijuteri, Halhal

  @Column({ unique: true })
  slug: string; // örn: kolye, kupe, bilezik — frontend dinamik kategori sayfası bunu kullanır

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: true })
  showInMenu: boolean;

  @Column({ default: true })
  showOnHomepage: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Category, { nullable: true })
  parent: Category;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
