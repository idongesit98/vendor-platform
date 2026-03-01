import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuCategory } from '../entities/menu-category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from '@/common/dto';
import { RpcException } from '@nestjs/microservices';
import { handleErrors } from '@/common/utils';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name, {
    timestamp: true,
  });

  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepository: Repository<MenuCategory>,
  ) {}

  async createCategory(categoryDto: CreateCategoryDto) {
    try {
      const existing = await this.categoryRepository.findOne({
        where: { name: categoryDto.name },
      });

      if (existing) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: `Category ${categoryDto.name} already exists`,
        });
      }

      const category = this.categoryRepository.create(categoryDto);
      const saved = await this.categoryRepository.save(category);
      this.logger.log(`Create category: ${saved.id} (${saved.name})`);
      this.logger.log('Created Category:', category);

      return {
        message: 'Category created',
        category: saved,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to create category');
      throw error;
    }
  }

  async AllCategories() {
    try {
      const allMenu = await this.categoryRepository.find({
        relations: ['menuItems'],
      });

      if (!allMenu) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No Category found',
        });
      }

      return {
        message: 'All categories found',
        Category: allMenu,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to find category');
    }
  }

  async getCategoryById(catId: string) {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id: catId },
        relations: ['menuItems'],
      });
      if (!category) {
        throw new RpcException(`Category item with #${catId} not found`);
      }
      return {
        message: 'Found single item',
        SingleCategory: category,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Single category found');
    }
  }
}
