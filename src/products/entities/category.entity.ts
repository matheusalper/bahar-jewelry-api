import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // örn: Kolye, Küpe, Bilezik, Yüzük, Set, Saç & Bijuteri

  @ManyToOne(() => Category, { nullable: true })
  parent: Category;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
