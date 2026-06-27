import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type BaharParaTransactionType =
  | 'earn'            // Siparişten kazanım
  | 'spend'           // Siparişte kullanım
  | 'refund'          // İptal/iade → kullanılan para iadesi
  | 'expire'          // Süresi dolma
  | 'admin_adjustment'; // Admin manuel işlem

export type BaharParaStatus =
  | 'pending'   // Ödeme onayı bekleniyor
  | 'active'    // Kullanılabilir
  | 'used'      // Kullanıldı
  | 'expired'   // Süresi doldu
  | 'cancelled'; // İptal edildi

@Entity('bahar_para_transactions')
export class BaharParaTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  orderId: string;

  @Column()
  type: BaharParaTransactionType;

  // Pozitif = kazanım/iade, Negatif = kullanım/iptal
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'active' })
  status: BaharParaStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
