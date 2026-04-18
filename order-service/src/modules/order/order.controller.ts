import { Controller, Logger } from '@nestjs/common';
import { OrderService } from './order.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto';

@Controller('order')
export class OrderController {
  private readonly logger = new Logger(OrderController.name, {
    timestamp: true,
  });
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'order.created' })
  createOrder(
    @Payload() payload: { userId: string; createDto: CreateOrderDto },
  ) {
    this.logger.log('Receiving payload', payload);
    return this.orderService.createOrder(payload.userId, payload.createDto);
  }

  @MessagePattern({ cmd: 'order.by-user' })
  getOrderByUser(@Payload() payload: { userId: string }) {
    return this.orderService.findOrdersByUser(payload.userId);
  }

  @MessagePattern({ cmd: 'order.by-vendor' })
  getOrderByVendor(@Payload() payload: { vendorId: string }) {
    return this.orderService.findOrdersByVendor(payload.vendorId);
  }

  @MessagePattern({ cmd: 'order.by-Id' })
  getOrderById(@Payload() payload: { orderId: string }) {
    return this.orderService.findOrderById(payload.orderId);
  }

  @MessagePattern({ cmd: 'order.status-updated' })
  updateOrderStatus(
    @Payload()
    payload: {
      orderId: string;
      vendorId: string;
      updateDto: UpdateOrderStatusDto;
    },
  ) {
    return this.orderService.updateStatus(
      payload.orderId,
      payload.vendorId,
      payload.updateDto,
    );
  }

  @MessagePattern({ cmd: 'order.cancelled' })
  cancelOrder(@Payload() payload: { orderId: string; userId: string }) {
    return this.orderService.cancelOrder(payload.orderId, payload.userId);
  }

  @MessagePattern({ cmd: 'order.delete' })
  deleteOrder(@Payload() payload: { orderId: string; vendorId: string }) {
    return this.orderService.deleteOrder(payload.orderId, payload.vendorId);
  }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'up', service: 'order-service' };
  }
}
