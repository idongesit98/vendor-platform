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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MENU_ITEM_SERVICE } from '../clients/client.module';
import { ClientProxy } from '@nestjs/microservices';
import { sendToService } from '@/common/utils';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser, Roles } from '@/common/decorators';
import { Role } from '@/common/enums';
import { UpdateMenuDto } from './dto';

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
  allMenu() {
    return sendToService(this.client, { cmd: 'menu.get-all' });
  }

  @Get('menu/:id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id') menuId: string) {
    return sendToService(this.client, { cmd: 'menu.single-menu' }, { menuId });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findByVendor(@Param('id') vendorId: string) {
    return sendToService(this.client, { cmd: 'menu.vendor' }, { vendorId });
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
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
