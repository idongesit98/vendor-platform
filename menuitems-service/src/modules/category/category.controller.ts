import { Controller } from '@nestjs/common';
import { CategoryService } from './category.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCategoryDto } from '@/common/dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @MessagePattern({ cmd: 'category.create' })
  createCategory(@Payload() catDto: CreateCategoryDto) {
    return this.categoryService.createCategory(catDto);
  }

  @MessagePattern({ cmd: 'category.all' })
  allCategory() {
    return this.categoryService.AllCategories();
  }

  @MessagePattern({ cmd: 'category.single' })
  singleCategory(@Payload() catId: string) {
    return this.categoryService.getCategoryById(catId);
  }
}
