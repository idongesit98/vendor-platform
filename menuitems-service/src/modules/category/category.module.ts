import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategory } from '../entities/menu-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory])],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
