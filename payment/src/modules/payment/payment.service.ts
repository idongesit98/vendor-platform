import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { Repository } from 'typeorm';
import { WebhookLog } from '../entities/webhook-log.entity';
import { PaystackProvider } from '@modules/payment/providers';
import {
  handleErrors,
  NOTIFICATION_SERVICE,
  ORDER_SERVICE,
} from '@/common/utils';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InitializePaymentResponse } from '@/common/utils/interfaces/intialize-payment-response';
import { InitializePaymentDto } from '../dto';
import { randomUUID } from 'crypto';
import { PaymentStatus } from '@/common/utils/enum';
import { IdempotencyService } from '@/idempotency/idempotency.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name, {
    timestamp: true,
  });

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepository: Repository<WebhookLog>,
    private readonly payStackProvider: PaystackProvider,
    @Inject(IdempotencyService)
    private readonly idempotencyService: IdempotencyService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @Inject(ORDER_SERVICE)
    private readonly orderClient: ClientProxy,
  ) {}

  async initializePayment(
    userId: string,
    paymentDto: InitializePaymentDto,
  ): Promise<InitializePaymentResponse | undefined> {
    console.log('=== STEP 1: initializePayment called ===');
    console.log('idempotencyKey:', paymentDto.idempotencyKey);
    const completedPaymentId = await this.idempotencyService.isComplete(
      paymentDto.idempotencyKey,
    );

    console.log('=== STEP 2: isComplete result:', completedPaymentId, '===');

    if (completedPaymentId) {
      this.logger.warn(
        `Duplicate payment - returning cached: ${paymentDto.idempotencyKey}`,
      );
      const existingId = await this.paymentRepository.findOne({
        where: { id: completedPaymentId },
      });
      return {
        paymentUrl: existingId!.paymentUrl!,
        reference: existingId!.providerReference,
        paymentId: existingId!.id,
      };
    }
    const existing = await this.paymentRepository.findOne({
      where: { idempotencyKey: paymentDto.idempotencyKey },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate payment attempt: ${paymentDto.idempotencyKey}`,
      );
      await this.idempotencyService.markComplete(
        paymentDto.idempotencyKey,
        existing.id,
      );
      return {
        paymentUrl: existing.paymentUrl!,
        reference: existing.providerReference,
        paymentId: existing.id,
      };
    }
    const reserved = await this.idempotencyService.reserve(
      paymentDto.idempotencyKey,
    );
    if (!reserved) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'Payment is already being processed. please wait.',
      });
    }

    //Validate the order via TCP(api-gateway)
    try {
      const orderResponse = await new Promise<{
        message: string;
        Orders: {
          orderId: string;
          userId: string;
          vendorId: string;
          totalAmount: number;
          status: string;
        };
      }>((resolve, reject) => {
        this.orderClient
          .send({ cmd: 'order.by-Id' }, { orderId: paymentDto.orderId })
          .subscribe({ next: resolve, error: reject });
      });
      const order = orderResponse.Orders;

      this.logger.log(`Order sent from order service:${JSON.stringify(order)}`);
      this.logger.log(
        `Comparing order.userId: "${order.userId}" (${typeof order.userId}) vs userId: "${userId}" (${typeof userId})`,
      );

      if (order.userId !== userId) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'You are not authorized to pay for this order',
        });
      }

      if (order.status !== 'confirmed') {
        throw new RpcException({
          statusCode: 400,
          message: `Order must be confirmed before payment. Current order status is ${order.status} and not eligible for payment`,
        });
      }
      const uuid: string = randomUUID();

      const reference = `PAY-${uuid.replace(/-/g, '').slice(0, 16)}`;

      //Initialize with Paystack
      const payStackResult = await this.payStackProvider.InitializeTransaction({
        email: paymentDto.email,
        amount: Number(order.totalAmount),
        reference,
        metadata: {
          orderId: paymentDto.orderId,
          userId,
          vendorId: order.vendorId,
          idempotencyKey: paymentDto.idempotencyKey,
        },
      });

      //Save payment record to database
      const payment = this.paymentRepository.create({
        idempotencyKey: paymentDto.idempotencyKey,
        orderId: paymentDto.orderId,
        userId,
        vendorId: order.vendorId,
        amount: Number(order.totalAmount),
        providerReference: payStackResult.reference,
        paymentUrl: payStackResult.paymentUrl,
        status: PaymentStatus.PENDING,
      });

      const saved = await this.paymentRepository.save(payment);

      //Mark complete to database after payment is made
      await this.idempotencyService.markComplete(
        paymentDto.idempotencyKey,
        saved.id,
      );

      //Emit the payment initiated event
      this.notificationClient.emit('payment.initiated', {
        orderId: paymentDto.orderId,
        userId,
        amount: Number(order.totalAmount),
      });

      this.logger.log(
        `Payment initialized: ${saved.id} for order: ${paymentDto.orderId}`,
      );

      return {
        paymentUrl: payStackResult.paymentUrl,
        reference: payStackResult.reference,
        paymentId: saved.id,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        await this.idempotencyService.delete(paymentDto.idempotencyKey);
        throw error;
      }
      await this.idempotencyService.set(paymentDto.idempotencyKey, 'Failed');
      handleErrors(error, this.logger, 'Failed to initialize payment');
    }
  }

  async handleWebhook(rawBody: string, signature: string) {
    const isValid = this.payStackProvider.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid webhook signature received');
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid webhook signature',
      });
    }

    const payload = JSON.parse(rawBody) as {
      event: string;
      data: {
        reference: string;
        status: string;
        amount: number;
        paid_at: string;
        id: number;
        metadata: {
          orderId: string;
          userId: string;
          vendorId: string;
        };
      };
    };

    //Log webhook for auditing things happening
    const webhookLog = this.webhookLogRepository.create({
      event: payload.event,
      reference: payload.data.reference,
      payload: payload as unknown as Record<string, unknown>,
    });

    const savedLog = await this.webhookLogRepository.save(webhookLog);

    try {
      await this.processWebhookEvent(payload.event, payload.data);

      await this.webhookLogRepository.update(savedLog.id, {
        processed: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.webhookLogRepository.update(savedLog.id, {
        processed: false,
        errorMessage: message,
      });
      this.logger.error(`Webhook processing failed: ${message}`);
    }
    return { received: true };
  }

  private async processWebhookEvent(
    event: string,
    data: {
      reference: string;
      status: string;
      amount: number;
      paid_at: string;
      id: number;
      metadata: { orderId: string; userId: string; vendorId: string };
    },
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { providerReference: data.reference },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${data.reference}`);
      return;
    }

    if (payment.status === PaymentStatus.SUCCESS || PaymentStatus.REFUNDED) {
      this.logger.warn(`Payment already processed: ${payment.id}`);
      return;
    }

    switch (event) {
      case 'charge.success':
        await this.handlePaymentSuccess(payment, data);
        break;
      case 'charge.failed':
        await this.handlePaymentFailed(payment, data);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event}`);
    }
  }

  private async handlePaymentSuccess(
    payment: Payment,
    data: {
      amount: number;
      paid_at: string;
      id: number;
      metadata: { orderId: string; userId: string; vendorId: string };
    },
  ) {
    await this.paymentRepository.update(
      { id: payment.id },
      {
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(data.paid_at),
        providerTransactionId: String(data.id),
        providerResponse: data as unknown as Record<string, unknown>,
      },
    );

    this.logger.log(`Payment successful: ${payment.id}`);

    //Update the order status via TCP
    this.orderClient.emit('order.payment_confirmed', {
      orderId: payment.orderId,
    });

    //send notification event
    this.notificationClient.emit('payment.completed', {
      orderId: payment.orderId,
      userId: payment.userId,
      vendorId: payment.vendorId,
      amount: payment.amount,
    });
  }

  private async handlePaymentFailed(
    payment: Payment,
    data: Record<string, unknown>,
  ) {
    await this.paymentRepository.update(payment.id, {
      status: PaymentStatus.FAILED,
      failureReason: 'Payment declined by provider',
      providerResponse: data,
    });

    this.logger.warn(`Payment failed: ${payment.id}`);

    this.notificationClient.emit('payment.failed', {
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
    });
  }

  async verifyPayment(reference: string, userId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { providerReference: reference, userId: userId },
    });

    if (!payment) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment not found',
      });
    }

    //If still pending, verify with paystack directly
    if (payment.status === PaymentStatus.PENDING) {
      const result = await this.payStackProvider.verifyTransaction(reference);
      if (result.status === PaymentStatus.SUCCESS) {
        await this.handlePaymentSuccess(payment, {
          amount: result.amount,
          paid_at: result.paidAt,
          id: parseInt(result.transactionId),
          metadata: {
            orderId: payment.orderId,
            userId: payment.userId,
            vendorId: payment.vendorId,
          },
        });

        return this.paymentRepository.findOne({
          where: { id: payment.id },
        }) as Promise<Payment>;
      }
    }
    return payment;
  }

  async findByOrder(orderId: string) {
    try {
      const existing = await this.paymentRepository.findOne({
        where: { orderId },
      });

      if (!existing) {
        return new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Order not found',
        });
      }

      return {
        message: 'Order found successfully',
        data: existing,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Couldnt find order');
    }
  }

  async findByUser(userId: string) {
    try {
      const existing = await this.paymentRepository.find({
        where: { userId: userId },
        order: { createdAt: 'DESC' },
      });

      if (!existing) {
        return new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User order not found',
        });
      }

      return {
        message: 'User order found successfully',
        data: existing,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Couldnt find user transactions');
    }
  }
}
