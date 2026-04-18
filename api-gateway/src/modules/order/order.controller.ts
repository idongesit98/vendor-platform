import { CurrentUser, Roles } from '@/common/decorators';
import { Role } from '@/common/enums';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { ORDER_SERVICE, sendToService } from '@/common/utils';
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
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import {
  ApiSuccessResponse,
  SwaggerResponses,
} from '@/common/decorators/swagger';

@ApiTags('Order')
@Controller('orders')
@ApiBearerAuth()
export class OrderController {
  constructor(@Inject(ORDER_SERVICE) private readonly client: ClientProxy) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create an order' })
  @ApiSuccessResponse({
    status: 200,
    description: 'User created successfully',
    type: CreateOrderDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  createOrder(
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateOrderDto,
  ) {
    return sendToService(
      this.client,
      { cmd: 'order.created' },
      { userId, createDto },
    );
  }

  @Get('user-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get order made by a user' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Get all orders made by a user',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  getMyOrders(@CurrentUser('sub') userId: string) {
    return sendToService(this.client, { cmd: 'order.by-user' }, { userId });
  }

  @Get('vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get order made to vendors' })
  @ApiSuccessResponse({
    status: 200,
    description: 'All orders for vendors gotten successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  getVendorOrder(@CurrentUser('sub') vendorId: string) {
    return sendToService(this.client, { cmd: 'order.by-vendor' }, { vendorId });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Find order by ID' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Orders by particular ID gotten successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  findById(@Param('id') orderId: string) {
    return sendToService(this.client, { cmd: 'order.by-Id' }, { orderId });
  }

  @Patch('status/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Update order status' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Orders status updated successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() updateDto: UpdateOrderStatusDto,
    @CurrentUser('sub') vendorId: string,
  ) {
    return sendToService(
      this.client,
      { cmd: 'order.status-updated' },
      { orderId, vendorId, updateDto },
    );
  }

  @Patch('cancel/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a customer order' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Order cancelled successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  cancelOrder(
    @Param('id') orderId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return sendToService(
      this.client,
      { cmd: 'order.cancelled' },
      { orderId, userId },
    );
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Delete customer order' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Orders deleted successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  deleteOrder(
    @Param('id') orderId: string,
    @CurrentUser('sub') vendorId: string,
  ) {
    return sendToService(
      this.client,
      { cmd: 'order.delete' },
      { orderId, vendorId },
    );
  }
}
