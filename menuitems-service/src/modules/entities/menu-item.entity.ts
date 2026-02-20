import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserOrder } from './user-order.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  category: string;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => UserOrder, (order) => order.menuItem)
  orders: UserOrder[];
}
