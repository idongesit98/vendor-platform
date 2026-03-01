import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuCategory } from './menu-categories.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  vendorId: string;

  @ManyToOne(() => MenuCategory, (category) => category.menuItems)
  @JoinColumn({ name: 'categoryId' })
  category: MenuCategory;

  @Column()
  categoryId: string;

  @Column({ default: false })
  isAvailable: boolean;

  @Column()
  imageUrl: string;

  @Column({ default: 0 })
  prepTime: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
