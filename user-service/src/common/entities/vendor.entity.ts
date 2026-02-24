import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../enums';
import { Review } from './review.entity';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.VENDOR })
  role: Role;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  description: string;

  @Column({ default: false })
  otpStatusSent: boolean;

  @Column({ unique: true, nullable: true })
  emailVerificationOtp: string;

  @Column({ nullable: true })
  otpExpiryTime: Date;

  @OneToMany(() => Review, (review) => review.vendor)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
