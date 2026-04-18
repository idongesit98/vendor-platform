import { Currency, PaymentProvider, PaymentStatus } from '@/common/utils/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PaymentProviderResponse, PaystackWebhookPayload } from './types';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  idempotencyKey: string;

  @Index()
  @Column()
  orderId: string;

  @Column()
  userId: string;

  @Column()
  vendorId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.NGN })
  currency: Currency;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.PAYSTACK,
  })
  provider: PaymentProvider;

  @Index()
  @Column({ nullable: true, unique: true })
  providerReference: string;

  @Column({ nullable: true })
  providerTransactionId?: string;

  @Column({ nullable: true })
  paymentUrl?: string;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  failedAt?: Date;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  failureReason?: string;

  @Column({ type: 'json', nullable: true })
  providerResponse?: PaymentProviderResponse;

  @Column({ type: 'jsonb', nullable: true })
  webhookPayload?: PaystackWebhookPayload;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
