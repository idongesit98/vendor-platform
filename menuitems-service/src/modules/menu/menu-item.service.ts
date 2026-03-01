import {
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuItem } from '../entities';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { CreateMenuDto, UpdateMenuItemDto } from '@/common/dto';
import { handleErrors } from '@/common/utils';

@Injectable()
export class MenuItemService {
  private readonly logger = new Logger(MenuItemService.name, {
    timestamp: true,
  });
  constructor(
    @InjectRepository(MenuItem)
    private menuItemRepo: Repository<MenuItem>,
  ) {}

  async createMenu(vendorId: string, createMenuDto: CreateMenuDto) {
    try {
      const existing = await this.menuItemRepo.findOne({
        where: { name: createMenuDto.name },
      });

      if (existing) {
        throw new ConflictException(
          `Menu with name ${createMenuDto.name} already exists`,
        );
      }

      const menu = this.menuItemRepo.create({ ...createMenuDto, vendorId });
      const saved = await this.menuItemRepo.save(menu);
      this.logger.log(
        `Create menu: ${saved.id} (${saved.name}) by vendor: ${vendorId}`,
      );

      return {
        message: 'Menu created successfully',
        Saved: saved,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to create menu');
    }
  }

  async getAllMenuItems() {
    try {
      const allMenu = await this.menuItemRepo.find({
        where: { isAvailable: true },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });

      if (!allMenu) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No menu items',
        });
      }
      return {
        message: 'All menu items found successfully',
        All: allMenu,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to create menu');
      throw error;
    }
  }

  async getMenuItemById(menuId: string) {
    try {
      const item = await this.menuItemRepo.findOne({
        where: { id: menuId },
        relations: ['category'],
      });
      if (!item) {
        throw new RpcException(`Menu item with #${menuId} not found`);
      }
      return {
        message: 'Found single item',
        SingleItem: item,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Single item found');
    }
  }

  async getMenuByVendor(vendorId: string) {
    try {
      const item = await this.menuItemRepo.findOne({
        where: { vendorId: vendorId },
        relations: ['category'],
      });
      if (!item) {
        throw new RpcException(`Menu item not found`);
      }
      return {
        message: 'Found single item',
        SingleItem: item,
      };
    } catch (error) {
      return handleErrors(error, this.logger, 'Single item found');
    }
  }

  async updateMenu(
    menuId: string,
    updateDto: UpdateMenuItemDto,
    vendorId: string,
  ) {
    try {
      const menuItem = await this.menuItemRepo.findOne({
        where: { id: menuId },
      });

      if (!menuItem) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Menu Item not found',
        });
      }

      if (menuItem?.vendorId !== vendorId) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'You are not authorized to update this menu item',
        });
      }

      await this.menuItemRepo.update({ id: menuId }, updateDto);
      const updatedVendor = await this.menuItemRepo.findOne({
        where: { id: menuId },
      });

      return {
        message: 'Menu updated successfully',
        Updated: updatedVendor,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Error updating Menu');
    }
  }

  async deleteMenu(menuId: string, vendorId: string) {
    try {
      const menu = await this.menuItemRepo.findOne({ where: { id: menuId } });

      if (!menu || menu.vendorId != vendorId) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'You are not authorized to delete this menu item',
        });
      }
      const deleted = await this.menuItemRepo.remove(menu);

      return {
        message: `Menu with ${menuId} deleted successfully`,
        Deleted: deleted,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Failed to delete menu');
      throw error;
    }
  }

  // async validateUser(userId: string): Promise<any> {
  //   try {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const user = await firstValueFrom(
  //       this.userClient.send({ cmd: 'user.findById' }, { userId }).pipe(
  //         timeout(5000),
  //         catchError(() => {
  //           throw new BadRequestException('User service unavailable');
  //         }),
  //       ),
  //     );
  //     return user;
  //   } catch (error) {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //     throw new BadRequestException(error.message || 'Failed to validate user');
  //   }
  // }
  // async placeOrder(dto: CreateOrderDto): Promise<UserOrder> {
  //   // 1. Validate user exists via TCP
  //   await this.validateUser(dto.userId);

  //   // 2. Validate menu item
  //   const menuItem = await this.getMenuItemById(dto.menuItemId);
  //   if (!menuItem.isAvailable) {
  //     throw new BadRequestException('Menu item is not available');
  //   }

  //   // 3. Create order
  //   const order = this.userOrderRepo.create({
  //     userId: dto.userId,
  //     menuItemId: dto.menuItemId,
  //     quantity: dto.quantity,
  //     status: 'pending',
  //   });

  //   return this.userOrderRepo.save(order);
  // }

  // async getUserOrders(userId: string): Promise<UserOrder[]> {
  //   // Validate user via TCP first
  //   await this.validateUser(userId);

  //   return this.userOrderRepo.find({
  //     where: { userId },
  //     relations: ['menuItem'],
  //     order: { orderedAt: 'DESC' },
  //   });
  // }
}
