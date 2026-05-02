import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { DataSource, Repository } from 'typeorm';
import { WebhookLog } from '../entities/webhook-log.entity';
import { PayStackProvider } from '@modules/payment/providers';
import {
  handleErrors,
  NOTIFICATION_SERVICE,
  ORDER_SERVICE,
} from '@/common/utils';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InitializePaymentResponse } from '@common/utils/interfaces/payment-interfaces';
import { InitializePaymentDto } from '../dto';
import { randomUUID } from 'crypto';
import { PaymentStatus } from '@/common/utils/enum';
import { IdempotencyService } from '@/idempotency/idempotency.service';
import {
  OrderResponse,
  WebhookData,
  WebhookPayload,
} from '@common/utils/interfaces';
import { PaymentOutbox } from '@modules/entities/payment.outbox.entity';

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
    @InjectRepository(PaymentOutbox)
    private readonly outboxRepository: Repository<PaymentOutbox>,
    private readonly payStackProvider: PayStackProvider,
    private readonly dataSource: DataSource,
    @Inject(IdempotencyService)
    private readonly idempotencyService: IdempotencyService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    @Inject(ORDER_SERVICE)
    private readonly orderClient: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.notificationClient.connect();
      this.logger.log('Connected to RabbitMQ');
    } catch (err: unknown) {
      //const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `RabbitMQ connection failed: ${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}`,
      );
    }
  }

  async initializePayment(
    userId: string,
    paymentDto: InitializePaymentDto,
  ): Promise<InitializePaymentResponse | undefined> {
    this.logger.log(
      `InitializePayment called - key: ${paymentDto.idempotencyKey}`,
    );

    const completedPaymentId = await this.idempotencyService.isComplete(
      paymentDto.idempotencyKey,
    );

    if (completedPaymentId) {
      this.logger.warn(
        `Duplicate payment - returning cached result for key: ${paymentDto.idempotencyKey}`,
      );

      const existing = await this.paymentRepository.findOne({
        where: { id: completedPaymentId },
      });

      if (!existing) {
        await this.idempotencyService.delete(paymentDto.idempotencyKey);
        throw new RpcException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Payment record not found for cached key. Please retry.`,
        });
      }

      return {
        paymentUrl: existing.paymentUrl!,
        reference: existing.providerReference,
        paymentId: existing.id,
      };
    }

    //Atomically reserve the key before a DB read, so if two concurrent request arrive with
    //the same key, only one gets the reservation, the other 409 immediately.

    const reserved = await this.idempotencyService.reserve(
      paymentDto.idempotencyKey,
    );

    if (!reserved) {
      //The key is held in case not complete, the key can be recovered from the DB
      const dbRecord = await this.paymentRepository.findOne({
        where: { idempotencyKey: paymentDto.idempotencyKey },
      });

      if (dbRecord) {
        // A previous attempt persisted a record mark complete and return it.
        this.logger.warn(
          `Key reserved but DB record exists - recovering: ${paymentDto.idempotencyKey}`,
        );

        await this.idempotencyService.markComplete(
          paymentDto.idempotencyKey,
          dbRecord.id,
        );
        return {
          paymentUrl: dbRecord.paymentUrl!,
          reference: dbRecord.providerReference,
          paymentId: dbRecord.id,
        };
      }
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'Payment is already being processed. Please wait',
      });
    }

    //Validate the order via TCP(api-gateway)
    try {
      const orderResponse = await new Promise<OrderResponse>(
        (resolve, reject) => {
          this.orderClient
            .send({ cmd: 'order.by-Id' }, { orderId: paymentDto.orderId })
            .subscribe({ next: resolve, error: reject });
        },
      );
      const order = orderResponse.Orders;

      this.logger.log(`Order received: ${JSON.stringify(order)}`);

      if (order.userId !== userId) {
        throw new RpcException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'You are not authorized to pay for this order',
        });
      }

      if (order.status !== 'confirmed') {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Order must be confirmed before payment. Current order status is ${order.status} and not eligible for payment`,
        });
      }
      const uuid: string = randomUUID();

      const reference = `PAY-${uuid.replace(/-/g, '').slice(0, 16)}`;

      //Initialize with PayStack
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

      /**
       * Persist payment and mark idempotency complete
       * The DB entry/write is wrapped in a single transaction so we never end up with a saved payment
       * that has no idempotency record or vice versa
       */

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let saved: Payment;
      try {
        const payment = queryRunner.manager.create(Payment, {
          idempotencyKey: paymentDto.idempotencyKey,
          orderId: paymentDto.orderId,
          userId,
          vendorId: order.vendorId,
          amount: Number(order.totalAmount),
          providerReference: payStackResult.reference,
          paymentUrl: payStackResult.paymentUrl,
          status: PaymentStatus.PENDING,
        });

        saved = await queryRunner.manager.save(Payment, payment);
        const outboxRow = queryRunner.manager.create(PaymentOutbox, {
          eventType: 'payment.initiated',
          payload: {
            orderId: paymentDto.orderId,
            userId,
            amount: Number(order.totalAmount),
          },
          processed: false,
          attempts: 0,
          processedAt: null,
        });

        await queryRunner.manager.save(PaymentOutbox, outboxRow);
        await queryRunner.commitTransaction();
      } catch (dbError) {
        await queryRunner.rollbackTransaction();
        //If transaction fails cancel the PayStack transaction so no orphaned transaction is left
        try {
          await this.payStackProvider.cancelTransaction(
            payStackResult.reference,
          );
          this.logger.warn(
            `PayStack transaction cancelled after DB failure: ${payStackResult.reference}`,
          );
        } catch (cancelError) {
          this.logger.error(
            `Failed to cancel PayStack transaction ${payStackResult.reference} afer DB error`,
            cancelError,
          );
        }
        throw dbError;
      } finally {
        await queryRunner.release();
      }
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
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid webhook signature',
      });
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;

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

  private async processWebhookEvent(event: string, data: WebhookData) {
    const payment = await this.paymentRepository.findOne({
      where: { providerReference: data.reference },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${data.reference}`);
      return;
    }

    if (
      payment.status === PaymentStatus.SUCCESS ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      this.logger.warn(`Payment already processed: ${payment.id}`);
      return;
    }

    if (event === 'charge.success' && data.amount !== payment.amount * 100) {
      this.logger.error(
        `Amount mismatch for payment ${payment.id}:` +
          `expected ${payment.amount * 100} kobo, received ${data.amount} kobo`,
      );
      await this.handlePaymentFailed(payment, {
        ...data,
        failureReason: 'Amount mismatch also possible tampering of webhook',
      } as unknown as Record<string, unknown>);
      return;
    }
    switch (event) {
      case 'charge.success':
        await this.handlePaymentSuccess(payment, data);
        break;
      case 'charge.failed':
        await this.handlePaymentFailed(
          payment,
          data as unknown as Record<string, unknown>,
        );
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event}`);
    }
  }

  private async handlePaymentSuccess(payment: Payment, data: WebhookData) {
    const result = await this.paymentRepository
      .createQueryBuilder()
      .update(Payment)
      .set({
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(data.paid_at),
        providerTransactionId: String(data.id),
        providerResponse: data as unknown as Record<string, unknown>,
      })
      .where('id = :id AND status = :status', {
        id: payment.id,
        status: PaymentStatus.PENDING,
      })
      .execute();

    if (result.affected === 0) {
      this.logger.warn(
        `Handle payment success: payment ${payment.id} was already updated, skipping this events`,
      );
      return;
    }

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
    const result = await this.paymentRepository
      .createQueryBuilder()
      .update(Payment)
      .set({
        status: PaymentStatus.FAILED,
        failureReason:
          (data.failureReason as string) ?? 'Payment declined by provider',
        providerResponse: data,
      })
      .where('id = :id AND status = :status', {
        id: payment.id,
        status: PaymentStatus.PENDING,
      })
      .execute();

    if (result.affected === 0) {
      this.logger.warn(
        `Handle payment failed: payment ${payment.id} was already updated, skipping events`,
      );
      return;
    }

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

    if (payment.status !== PaymentStatus.PENDING) {
      return payment;
    }

    /*
     * If transaction is still pending call paystack to verify
     */
    const result = await this.payStackProvider.verifyTransaction(reference);

    if (result.status === PaymentStatus.SUCCESS) {
      await this.handlePaymentSuccess(payment, {
        amount: result.amount,
        paid_at: result.paidAt,
        id: parseInt(result.transactionId),
        reference,
        status: PaymentStatus.SUCCESS,
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
      if (error instanceof RpcException) throw error;
      handleErrors(error, this.logger, 'Could not find order');
    }
  }

  async findByUser(userId: string) {
    try {
      const existing = await this.paymentRepository.find({
        where: { userId: userId },
        order: { createdAt: 'DESC' },
      });

      if (!existing.length) {
        return new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No transaction found for this user',
        });
      }

      return {
        message: 'User transactions found successfully',
        data: existing,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      handleErrors(error, this.logger, 'Couldnt find user transactions');
    }
  }

  async initiateRefund(
    paymentId: string,
    vendorId: string,
    reason: string,
  ): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment || payment.vendorId !== vendorId) {
      throw new RpcException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Not authorized to refund this payment',
      });
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Only successful payment can be refunded',
      });
    }

    const claim = await this.paymentRepository
      .createQueryBuilder()
      .update(Payment)
      .set({ status: PaymentStatus.REFUND_PENDING })
      .where('id = :id AND status = :status', {
        id: payment.id,
        status: PaymentStatus.SUCCESS,
      })
      .execute();

    if (claim.affected === 0) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'Refund already in progress for this payment',
      });
    }

    try {
      await this.payStackProvider.refundTransaction({
        reference: payment.providerReference,
        amount: payment.amount,
      });
    } catch (providerError) {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        failureReason: 'Refund attempt failed - provider error',
      });

      this.logger.error(
        `PayStack refund failed for payment ${payment.id}`,
        providerError,
      );

      throw new RpcException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message:
          'Refund could not be processed by payment provider. please retry.',
      });
    }
    await this.paymentRepository.update(payment?.id, {
      status: PaymentStatus.REFUNDED,
    });
    this.notificationClient.emit('payment.refunded', {
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
      reason,
    });
    this.logger.log(`Refund completed for payment: ${payment.id}`);
  }
}
