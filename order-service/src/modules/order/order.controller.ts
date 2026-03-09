import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'order.create' })
  createOrder(
    @Payload() payload: { userId: string; createDto: CreateOrderDto },
  ) {
    console.log('Receiving payload', payload);
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

  @MessagePattern({ cmd: 'order.update-status' })
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

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'up', service: 'order-service' };
  }
}
