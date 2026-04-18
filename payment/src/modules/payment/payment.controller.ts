import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InitializePaymentDto } from '../dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name, {
    timestamp: true,
  });

  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern({ cmd: 'payment-initialize' })
  InitializePayment(
    @Payload() payload: { userId: string; initializeDto: InitializePaymentDto },
  ) {
    return this.paymentService.initializePayment(
      payload.userId,
      payload.initializeDto,
    );
  }

  @MessagePattern({ cmd: 'payment.verify' })
  verifyPayment(@Payload() payload: { reference: string; userId: string }) {
    return this.paymentService.verifyPayment(payload.reference, payload.userId);
  }

  @MessagePattern({ cmd: 'payment.findByOrder' })
  findByOrder(@Payload() payload: { orderId: string }) {
    return this.paymentService.findByOrder(payload.orderId);
  }

  @MessagePattern({ cmd: 'payment.findByUser' })
  findByUser(@Payload() payload: { userId: string }) {
    return this.paymentService.findByUser(payload.userId);
  }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'up', service: 'payment-service' };
  }
}
