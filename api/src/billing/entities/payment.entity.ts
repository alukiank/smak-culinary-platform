import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Currency } from '../enums/currency.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.UAH })
  currency: Currency;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true, unique: true })
  orderId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  externalTransactionData: Record<string, any>;

  @Column({ nullable: true })
  externalTransactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user: User;

  @Column({ nullable: true })
  userId: string | null;
}
