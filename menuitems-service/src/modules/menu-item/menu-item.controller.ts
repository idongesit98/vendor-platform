import { Body, Controller, Param, ParseIntPipe } from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { CreateOrderDto } from '@/common/dto/create-order.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMenuDto } from '@/common/dto';

@Controller('menu-item')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @MessagePattern({ cmd: 'menu.get-all' })
  getAllMenu() {
    return this.menuItemService.getAllMenuItems();
  }

  @MessagePattern({ cmd: 'menu.single-menu' })
  getMenuItem(@Param('id', ParseIntPipe) id: number) {
    return this.menuItemService.getMenuItemById(id);
  }

  // @MessagePattern({ cmd: 'menu.create' })
  // createMenuItem(@Body() body: any) {
  //   return this.menuItemService.create(body);
  // }

  @MessagePattern({ cmd: 'menu.create' })
  createMenus(@Payload() payload: CreateMenuDto) {
    return this.menuItemService.createMenu(payload);
  }

  @MessagePattern({ cmd: 'menu.order' })
  placeOrder(@Body() dto: CreateOrderDto) {
    return this.menuItemService.placeOrder(dto);
  }

  // @Get('orders/user/:userId')
  @MessagePattern({ cmd: 'menu.order' })
  getUserOrders(@Param('userId') userId: string) {
    return this.menuItemService.getUserOrders(userId);
  }

  @MessagePattern({ cmd: 'menu.get-all' })
  getAllMenuItemsTcp() {
    return this.menuItemService.getAllMenuItems();
  }

  @MessagePattern({ cmd: 'menu.with-user' })
  withUser(@Payload() payload: { id: string }) {
    return this.menuItemService.validateUser(payload.id);
  }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'up', service: 'menu-item-service' };
  }
}
