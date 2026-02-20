import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity('user_orders')
export class UserOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  userId: string; // Reference to User Service user ID

  @Column()
  menuItemId: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: 'pending' }) // pending | confirmed | delivered
  status: string;

  @CreateDateColumn()
  orderedAt: Date;

  @ManyToOne(() => MenuItem, (item) => item.orders)
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;
}
