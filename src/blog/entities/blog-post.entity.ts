import {
  Column, CreateDateColumn, Entity,
  ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BlogStatus {
  DRAFT     = 'draft',
  PUBLISHED = 'published',
  ARCHIVED  = 'archived',
}

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string;         // Kısa özet

  @Column({ type: 'text', nullable: true })
  content: string;         // HTML içerik

  @Column({ type: 'varchar', nullable: true })
  coverImage: string;      // Kapak görseli URL

  @Column({ type: 'varchar', nullable: true })
  category: string;        // Çelik Takılar, Takı Bakımı vb.

  @Column({ type: 'varchar', nullable: true })
  tags: string;            // Virgülle ayrılmış etiketler

  @Column({ type: 'enum', enum: BlogStatus, default: BlogStatus.DRAFT })
  status: BlogStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  // SEO alanları
  @Column({ type: 'varchar', nullable: true })
  seoTitle: string;

  @Column({ type: 'text', nullable: true })
  seoDescription: string;

  @Column({ type: 'varchar', nullable: true })
  seoKeywords: string;

  // Yazar
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'varchar', nullable: true })
  authorId: string;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
