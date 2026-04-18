import {
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCategoryDto } from '../dto';
import { MENU_ITEM_SERVICE, sendToService } from '@/common/utils';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import {
  ApiSuccessResponse,
  SwaggerResponses,
} from '@/common/decorators/swagger';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(
    @Inject(MENU_ITEM_SERVICE) private readonly client: ClientProxy,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a category' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Category created successfully by vendor',
    type: CreateCategoryDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  createCategory(@Body() createCategory: CreateCategoryDto) {
    return sendToService(
      this.client,
      { cmd: 'category.create' },
      createCategory,
    );
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check all categories' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Categories viewed successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  allCategory() {
    return sendToService(this.client, { cmd: 'category.all' });
  }

  @Get('single/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Category viewed successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  singleCat(@Param('id') categoryId: string) {
    return sendToService(this.client, { cmd: 'category.single' }, categoryId);
  }
}
