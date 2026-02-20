import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuItem, UserOrder } from '../entities';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from '@/common/dto/create-order.dto';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { CreateMenuDto } from '@/common/dto';

@Injectable()
export class MenuItemService {
  private readonly logger = new Logger(MenuItemService.name);
  constructor(
    @InjectRepository(MenuItem)
    private menuItemRepo: Repository<MenuItem>,

    @InjectRepository(UserOrder)
    private userOrderRepo: Repository<UserOrder>,

    @Inject('USER_SERVICE')
    private userClient: ClientProxy,
  ) {}

  async createMenu(createMenuDto: CreateMenuDto): Promise<MenuItem> {
    const existing = await this.menuItemRepo.findOne({
      where: { name: createMenuDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Menu with name ${createMenuDto.name} already exists`,
      );
    }

    const menu = this.menuItemRepo.create(createMenuDto);
    const saved = await this.menuItemRepo.save(menu);
    this.logger.log(`Create menu: ${saved.id} (${saved.name})`);
    return saved;
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return this.menuItemRepo.find({ where: { isAvailable: true } });
  }

  async getMenuItemById(id: number): Promise<MenuItem> {
    const item = await this.menuItemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Menu item #${id} not found`);
    }
    return item;
  }

  async validateUser(userId: string): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const user = await firstValueFrom(
        this.userClient.send({ cmd: 'user.findById' }, { userId }).pipe(
          timeout(5000),
          catchError(() => {
            throw new BadRequestException('User service unavailable');
          }),
        ),
      );
      return user;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(error.message || 'Failed to validate user');
    }
  }
  async placeOrder(dto: CreateOrderDto): Promise<UserOrder> {
    // 1. Validate user exists via TCP
    await this.validateUser(dto.userId);

    // 2. Validate menu item
    const menuItem = await this.getMenuItemById(dto.menuItemId);
    if (!menuItem.isAvailable) {
      throw new BadRequestException('Menu item is not available');
    }

    // 3. Create order
    const order = this.userOrderRepo.create({
      userId: dto.userId,
      menuItemId: dto.menuItemId,
      quantity: dto.quantity,
      status: 'pending',
    });

    return this.userOrderRepo.save(order);
  }

  async getUserOrders(userId: string): Promise<UserOrder[]> {
    // Validate user via TCP first
    await this.validateUser(userId);

    return this.userOrderRepo.find({
      where: { userId },
      relations: ['menuItem'],
      order: { orderedAt: 'DESC' },
    });
  }
}
