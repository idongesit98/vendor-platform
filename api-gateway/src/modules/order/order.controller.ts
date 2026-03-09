import { CurrentUser, Roles } from '@/common/decorators';
import { Role } from '@/common/enums';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { ORDER_SERVICE, sendToService } from '@/common/utils';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';

@ApiTags('Order')
@Controller('orders')
@ApiBearerAuth()
export class OrderController {
  constructor(@Inject(ORDER_SERVICE) private readonly client: ClientProxy) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  createOrder(
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateOrderDto,
  ) {
    return sendToService(
      this.client,
      { cmd: 'order.create' },
      { userId, createDto },
    );
  }

  @Get('user-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  getMyOrders(@CurrentUser('sub') userId: string) {
    return sendToService(this.client, { cmd: 'order.by-user' }, { userId });
  }

  @Get('vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  getVendorOrder(@CurrentUser('sub') vendorId: string) {
    return sendToService(this.client, { cmd: 'order.by-vendor' }, { vendorId });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') orderId: string) {
    return sendToService(this.client, { cmd: 'order.by-Id' }, { orderId });
  }

  @Patch('status/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() updateDto: UpdateOrderStatusDto,
    @CurrentUser('sub') vendorId: string,
  ) {
    return sendToService(
      this.client,
      { cmd: 'order.update-status' },
      { orderId, updateDto, vendorId },
    );
  }
}
