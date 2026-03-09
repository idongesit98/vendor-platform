import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderItem } from '../entities';
import { DataSource, Repository } from 'typeorm';
import { MENU_SERVICE, NOTIFICATION_SERVICE } from '@/common/utils/const';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto';
import { firstValueFrom } from 'rxjs';
import { MenuItemResponse } from '@/common/utils/interface';
import { OrderStatus } from '@/common/utils/enum/order-status';
import { handleErrors } from '@/common/utils';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name, { timestamp: true });

  constructor(
    private readonly datasource: DataSource,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @Inject(MENU_SERVICE)
    private readonly menuClient: ClientProxy,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
  ) {}

  async createOrder(userId: string, createDto: CreateOrderDto) {
    if (!createDto.items?.length) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Order must contain at least one item',
      });
    }
    const menuItemIds = createDto.items.map((item) => item.menuItemId);

    const menuItems = await firstValueFrom(
      this.menuClient.send<MenuItemResponse[]>(
        { cmd: 'menu.findManyIds' },
        { ids: menuItemIds },
      ),
    );
    this.logger.log(menuItemIds);

    if (!menuItems.length) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Menu items not found',
      });
    }

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    let totalAmount = 0;
    let vendorId: string | null = null;

    const orderItems: OrderItem[] = [];

    for (const item of createDto.items) {
      const menuItem = menuMap.get(item.menuItemId);

      if (!menuItem) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Menu item ${item.menuItemId} not found`,
        });
      }

      if (!menuItem.isAvailable) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Menu item ${menuItem.name} is not available`,
        });
      }

      if (vendorId && vendorId !== menuItem.vendorId) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'All items in an order must be from the same vendor',
        });
      }

      vendorId = menuItem.vendorId;

      const subtotal = Number(menuItem.price) * item.quantity;
      totalAmount += subtotal;

      const orderItem = this.orderItemRepository.create({
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal,
      });

      orderItems.push(orderItem);
    }

    const savedOrder = await this.datasource.transaction(async (manager) => {
      const order = manager.create(Order, {
        userId,
        vendorId: vendorId!,
        totalAmount: totalAmount,
        notes: createDto.notes,
        status: OrderStatus.PENDING,
        items: orderItems,
      });

      return await manager.save(order);
    });

    this.logger.log(`Order created: ${savedOrder.id} by user: ${userId}`);

    this.notificationClient.emit('order.create', {
      orderId: savedOrder.id,
      userId,
      vendorId,
      totalAmount,
      items: orderItems.map((i) => ({
        name: i.menuItemId,
        quantiy: i.quantity,
        price: i.price,
      })),
    });

    return {
      message: 'Order created successfully',
      Saved: savedOrder,
    };
  }

  async findOrdersByUser(userId: string) {
    try {
      const userOrder = await this.orderRepository.findOne({
        where: { userId: userId },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });

      if (!userOrder) {
        throw new RpcException(`Order item wit #${userId} not found`);
      }

      return {
        message: 'Found user Order',
        UserOrder: userOrder,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Order made by user not found');
    }
  }

  async findOrdersByVendor(vendorId: string) {
    try {
      const vendorOrder = await this.orderRepository.findOne({
        where: { vendorId: vendorId },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });

      if (!vendorOrder) {
        throw new RpcException(`Order item wit #${vendorId} not found`);
      }

      return {
        message: 'Found orders made to vendor',
        VendorOrder: vendorOrder,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Orders made to vendors not found');
    }
  }

  async findOrderById(orderId: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        throw new RpcException(`Order with id ${orderId} not found`);
      }

      return {
        message: 'Order found',
        Orders: order,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Order item found');
    }
  }

  async updateStatus(
    orderId: string,
    vendorId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    try {
      const orderItem = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!orderItem) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Order was not found',
        });
      }

      if (orderItem?.vendorId !== vendorId) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'You are not authorized to update this order status',
        });
      }
      await this.orderRepository.update(
        { id: orderId },
        { status: updateDto.status },
      );

      const updatedStatus = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      this.notificationClient.emit('order.status_updated', {
        id: orderId,
        userId: orderItem.userId,
        vendorId,
        status: updateDto.status,
      });

      return {
        message: 'Order status updated successfully',
        Updated: updatedStatus,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Order not successfully updated');
    }
  }
}
