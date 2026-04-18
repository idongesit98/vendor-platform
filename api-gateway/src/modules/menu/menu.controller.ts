import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { MENU_ITEM_SERVICE, sendToService } from '@/common/utils';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser, Roles } from '@/common/decorators';
import { Role } from '@/common/enums';
import { UpdateMenuDto } from './dto';
import {
  ApiSuccessResponse,
  SwaggerResponses,
} from '@/common/decorators/swagger';

@ApiTags('Menu')
@Controller('menu-item')
export class MenuController {
  constructor(
    @Inject(MENU_ITEM_SERVICE) private readonly client: ClientProxy,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a menu for user to see and vendor to advertise',
  })
  @ApiSuccessResponse({
    status: 200,
    description: 'Create menu',
    type: CreateMenuDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  createMenu(
    @CurrentUser('sub') vendorId: string,
    @Body() createDto: CreateMenuDto,
  ) {
    return sendToService(
      this.client,
      { cmd: 'menu.create' },
      { vendorId, createDto },
    );
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all available menu' })
  @ApiSuccessResponse({
    status: 200,
    description: 'All menu returned successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  allMenu() {
    return sendToService(this.client, { cmd: 'menu.get-all' });
  }

  @Get('menu/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get menu by ID' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Verify email created',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  findById(@Param('id') menuId: string) {
    return sendToService(this.client, { cmd: 'menu.single-menu' }, { menuId });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find a user by ID of the vendor' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Verify email created',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  findByVendor(@Param('id') vendorId: string) {
    return sendToService(this.client, { cmd: 'menu.vendor' }, { vendorId });
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a menu created by a vendor' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Update a category',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  menuUpdate(
    @Param('id') menuId: string,
    @Body() updateDto: UpdateMenuDto,
    @CurrentUser('sub') vendorId: string,
  ) {
    return sendToService(
      this.client,
      { cmd: 'menu.update' },
      { menuId, updateDto, vendorId },
    );
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vendor' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Delete a vendor',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  deleteMenu(
    @Param('id') menuId: string,
    @CurrentUser('sub') vendorId: string,
  ) {
    return sendToService(
      this.client,
      { cmd: 'menu.delete' },
      { menuId, vendorId },
    );
  }
}
