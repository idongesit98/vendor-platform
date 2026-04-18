import { CurrentUser, Roles } from '@/common/decorators';
import { Role } from '@/common/enums';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { PAYMENT_SERVICE, sendToService } from '@/common/utils';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InitializePaymentDto } from './dto/initialize-payment';
import {
  ApiSuccessResponse,
  SwaggerResponses,
} from '@/common/decorators/swagger';
import { randomUUID } from 'crypto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(@Inject(PAYMENT_SERVICE) private readonly client: ClientProxy) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Initialize a Transaction' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Transaction initialized successfully',
    type: InitializePaymentDto,
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  initializePayment(
    @Body() initializeDto: InitializePaymentDto,
    @CurrentUser('sub') userId: string,
  ) {
    if (!initializeDto.idempotencyKey) {
      initializeDto.idempotencyKey = randomUUID();
    }
    console.log('Message receiver to initialize');
    return sendToService(
      this.client,
      { cmd: 'payment-initialize' },
      { userId, initializeDto },
    );
  }

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a transaction' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Transaction verified successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  verifyPayment(
    @Param('reference') reference: string,
    @CurrentUser('sub') userId: string,
  ) {
    return sendToService(
      this.client,
      { cmd: 'payment.verify' },
      { reference, userId },
    );
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find an order placed' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Find an order placed',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  findByOrder(@Param('orderId') orderId: string) {
    return sendToService(
      this.client,
      { cmd: 'payment.findByOrder' },
      { orderId },
    );
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find my payments' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Payment found successfully',
  })
  @ApiResponse(SwaggerResponses.unauthorized)
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  findMyPayments(@CurrentUser('sub') userId: string) {
    return sendToService(
      this.client,
      { cmd: 'payment.findByUser' },
      { userId },
    );
  }
}
