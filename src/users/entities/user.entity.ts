import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  // BaharPara sadakat sistemi bakiyesi (TL cinsinden)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baharParaBalance: number;

  @Column()
  password: string; // bcryptjs ile hash'lenmiş halde saklanır (Faz 2)

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
