import { MENU_ITEM_SERVICE } from '@/modules/clients/client.module';
import {
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Body,
  Get,
  Param,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategoryDto } from '../dto';
import { sendToService } from '@/common/utils';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(
    @Inject(MENU_ITEM_SERVICE) private readonly client: ClientProxy,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  createCategory(@Body() createCategory: CreateCategoryDto) {
    return sendToService(
      this.client,
      { cmd: 'category.create' },
      createCategory,
    );
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  allCategory() {
    return sendToService(this.client, { cmd: 'category.all' });
  }

  @Get('single/:id')
  @HttpCode(HttpStatus.OK)
  singleCat(@Param('id') categoryId: string) {
    return sendToService(this.client, { cmd: 'category.single' }, categoryId);
  }
}
