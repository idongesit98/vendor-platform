import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('payment_outbox')
export class PaymentOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ default: false })
  processed: boolean;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string | null;

  @Column({ default: 0 })
  attempts: number;

  @CreateDateColumn()
  createdAt: string;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;
}
