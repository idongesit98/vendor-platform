import { Controller } from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMenuDto, UpdateMenuItemDto } from '@/common/dto';

@Controller('menu-item')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @MessagePattern({ cmd: 'menu.create' })
  createMenu(
    @Payload() payload: { vendorId: string; createDto: CreateMenuDto },
  ) {
    console.log('Receiving payload', payload);
    return this.menuItemService.createMenu(payload.vendorId, payload.createDto);
  }

  @MessagePattern({ cmd: 'menu.get-all' })
  getAllMenu() {
    return this.menuItemService.getAllMenuItems();
  }

  @MessagePattern({ cmd: 'menu.single-menu' })
  getMenuItemById(@Payload() payload: { menuIds: string }) {
    return this.menuItemService.getMenuItemById(payload.menuIds);
  }

  @MessagePattern({ cmd: 'menu.findManyIds' })
  getManyMenusById(@Payload('ids') menuIds: string[]) {
    console.log('MENU PAYLOAD:', menuIds);
    return this.menuItemService.getMenuItemsByIds(menuIds);
  }

  @MessagePattern({ cmd: 'menu.vendor' })
  getMenuByVendor(@Payload() payload: { vendorId: string }) {
    return this.menuItemService.getMenuByVendor(payload.vendorId);
  }

  @MessagePattern({ cmd: 'menu.update' })
  updateMenu(
    @Payload()
    payload: {
      menuId: string;
      updateDto: UpdateMenuItemDto;
      vendorId: string;
    },
  ) {
    return this.menuItemService.updateMenu(
      payload.menuId,
      payload.updateDto,
      payload.vendorId,
    );
  }

  @MessagePattern({ cmd: 'menu.delete' })
  deleteMenu(@Payload() payload: { menuId: string; vendorId: string }) {
    return this.menuItemService.deleteMenu(payload.menuId, payload.vendorId);
  }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'up', service: 'menu-item-service' };
  }
}
