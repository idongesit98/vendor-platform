import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Menu')
@Controller('menu-item')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('create')
  createMenu(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.createMenu(createMenuDto);
  }

  @Get('all')
  allMenu() {
    return this.menuService.getAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Get(':id')
  withMenu(@Param('id') id: string) {
    return this.menuService.withUser(id);
  }

  // @Post('order')
  // order(@Body() orderDto: OrderDto) {
  //   return this.menuService.placeOrder();
  // }
}
