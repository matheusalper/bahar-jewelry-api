import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string; // küçük üst başlık / etiket

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  button1Text: string;

  @Column({ nullable: true })
  button1Link: string;

  @Column({ nullable: true })
  button2Text: string;

  @Column({ nullable: true })
  button2Link: string;

  @Column({ nullable: true })
  originalImage: string;

  @Column({ nullable: true })
  desktopImage: string;

  @Column({ nullable: true })
  tabletImage: string;

  @Column({ nullable: true })
  mobileImage: string;

  @Column({ nullable: true })
  thumbnailImage: string;

  @Column({ default: 0 })
  sortOrder: number;

  // 'contain' (Tamamını Göster, varsayılan) veya 'cover' (Alanı Doldur)
  @Column({ default: 'contain' })
  fitMode: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
