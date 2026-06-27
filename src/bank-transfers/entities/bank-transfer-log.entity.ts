import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type BankTransferResult =
  | 'matched'
  | 'partial_match'
  | 'no_match'
  | 'error'
  | 'manual_approved'
  | 'manual_rejected';

@Entity('bank_transfer_logs')
export class BankTransferLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  expectedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  foundAmount: number;

  @Column({ nullable: true })
  senderName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  transactionId: string;

  // Eşleşme skoru (0-115 arası, 80+ = otomatik onayla)
  @Column({ type: 'int', default: 0 })
  matchScore: number;

  // Her kriterin kaç puan aldığı (debug ve şeffaflık için)
  @Column({ type: 'jsonb', default: {} })
  scoreBreakdown: Record<string, number>;

  @Column({ default: 'pending' })
  result: BankTransferResult;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 'mock' }) // 'mock' | 'open_banking' | 'custom' | 'manual'
  provider: string;

  @CreateDateColumn()
  checkedAt: Date;
}
