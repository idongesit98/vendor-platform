import { Controller, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  NotificationChannel,
  NotificationType,
  OrderStatus,
  RecipientType,
} from '@/common/utils/enum';

@Controller('notification')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name, {
    timestamp: true,
  });

  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user.created')
  async handleUserCreated(
    @Payload()
    payload: {
      email: string;
      firstName: string;
      lastName: string;
      otp: string;
      verificationLink: string;
    },
  ) {
    this.logger.log(`RAW PAYLOAD: ${JSON.stringify(payload)}`);
    this.logger.log(`Event received and user created - ${payload.email}`);

    //Send notification to USER
    await this.notificationService.createAndSend({
      recipientId: payload.email,
      recipientType: RecipientType.USER,
      type: NotificationType.USER_REGISTERED,
      correlationId: payload.email,
      channel: NotificationChannel.IN_APP,
      metadata: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
    });

    //Send Verification Email to user
    await this.notificationService.createAndSend({
      recipientId: payload.email,
      recipientType: RecipientType.USER,
      type: NotificationType.USER_REGISTERED,
      correlationId: payload.email,
      channel: NotificationChannel.EMAIL,
      metadata: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        otp: payload.otp,
        verificationLink: payload.verificationLink,
      },
    });
  }

  @EventPattern('order.created')
  async handleOrderCreated(
    @Payload()
    payload: {
      orderId: string;
      userId: string;
      vendorId: string;
      totalAmount: number;
    },
  ) {
    this.logger.log(`Event received: Order created - ${payload.orderId}`);
    await this.notificationService.createAndSend({
      recipientId: payload.vendorId,
      recipientType: RecipientType.VENDOR,
      type: NotificationType.ORDER_CREATED,
      channel: NotificationChannel.IN_APP,
      correlationId: payload.orderId,
      metadata: { orderId: payload.orderId, totalAmount: payload.totalAmount },
    });

    await this.notificationService.createAndSend({
      recipientId: payload.userId,
      recipientType: RecipientType.USER,
      type: NotificationType.ORDER_CREATED,
      correlationId: payload.orderId,
      channel: NotificationChannel.IN_APP,
      metadata: { orderId: payload.orderId, totalAmount: payload.totalAmount },
    });
  }

  @EventPattern('order.status-updated')
  async handleOrderStatusUpdated(
    @Payload()
    payload: {
      orderId: string;
      userId: string;
      vendorId: string;
      status: OrderStatus;
    },
  ) {
    this.logger.log(
      `Event received: order.status_updated - ${payload.orderId} -> ${payload.status}`,
    );

    const typeMap: Partial<Record<OrderStatus, NotificationType>> = {
      [OrderStatus.CONFIRMED]: NotificationType.ORDER_CONFIRMED,
      [OrderStatus.PREPARING]: NotificationType.ORDER_PREPARING,
      [OrderStatus.READY]: NotificationType.ORDER_READY,
      [OrderStatus.DELIVERED]: NotificationType.ORDER_DELIVERED,
      [OrderStatus.CANCELLED]: NotificationType.ORDER_CANCELLED,
    };

    const type = typeMap[payload.status];
    if (!type) return;

    await this.notificationService.createAndSend({
      recipientId: payload.userId,
      recipientType: RecipientType.USER,
      type,
      correlationId: `${payload.orderId}-${payload.status}`,
      channel: NotificationChannel.IN_APP,
      metadata: { orderId: payload.orderId, status: payload.status },
    });

    this.logger.log(
      `Event received for Order: order.status_updated - ${payload.orderId} -> ${payload.status}`,
    );
  }

  @EventPattern('payment.initiated')
  async handlePaymentInitiated(
    @Payload() payload: { orderId: string; userId: string; amount: string },
  ) {
    await this.notificationService.createAndSend({
      recipientId: payload.userId,
      recipientType: RecipientType.USER,
      type: NotificationType.PAYMENT_INITIATED,
      correlationId: payload.orderId,
      channel: NotificationChannel.IN_APP,
      metadata: { orderId: payload.orderId, amount: payload.amount },
    });
  }

  @EventPattern('payment.completed')
  async handlePaymentCompleted(
    @Payload()
    payload: {
      orderId: string;
      userId: string;
      vendorId: string;
      amount: number;
    },
  ) {
    await this.notificationService.createAndSend({
      recipientId: payload.userId,
      recipientType: RecipientType.USER,
      type: NotificationType.PAYMENT_COMPLETED,
      correlationId: payload.orderId,
      channel: NotificationChannel.IN_APP,
      metadata: { orderId: payload.orderId, amount: payload.amount },
    });

    await this.notificationService.createAndSend({
      recipientId: payload.vendorId,
      recipientType: RecipientType.VENDOR,
      type: NotificationType.PAYMENT_COMPLETED,
      correlationId: payload.orderId,
      channel: NotificationChannel.IN_APP,
      metadata: { orderId: payload.orderId, amount: payload.amount },
    });
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(
    @Payload() payload: { orderId: string; userId: string; amount: number },
  ) {
    await this.notificationService.createAndSend({
      recipientId: payload.userId,
      recipientType: RecipientType.USER,
      type: NotificationType.PAYMENT_FAILED,
      correlationId: payload.orderId,
      channel: NotificationChannel.IN_APP,
      metadata: { orderId: payload.orderId, amount: payload.amount },
    });
  }

  @EventPattern('vendor.verified')
  async handleVendorVerified(@Payload() payload: { vendorId: string }) {
    await this.notificationService.createAndSend({
      recipientId: payload.vendorId,
      recipientType: RecipientType.VENDOR,
      type: NotificationType.VENDOR_VERIFIED,
      correlationId: payload.vendorId,
      channel: NotificationChannel.IN_APP,
      metadata: { vendorId: payload.vendorId },
    });
  }

  @MessagePattern({ cmd: 'notification.findByRecipient' })
  findByRecipient(
    @Payload() payload: { recipientId: string; recipientType: RecipientType },
  ) {
    return this.notificationService.findByRecipient(
      payload.recipientId,
      payload.recipientType,
    );
  }

  @MessagePattern({ cmd: 'notification.markAsRead' })
  markAsRead(@Payload() payload: { notifId: string; recipientId: string }) {
    return this.notificationService.markAsRead(
      payload.notifId,
      payload.recipientId,
    );
  }

  @MessagePattern({ cmd: 'notification.markAllAsRead' })
  markAllAsRead(@Payload() payload: { recipientId: string }) {
    return this.notificationService.markAllAsRead(payload.recipientId);
  }

  @MessagePattern({ cmd: 'notification.unReadCount' })
  getUnReadCount(@Payload() payload: { recipientId: string }) {
    return this.notificationService.getUnReadCount(payload.recipientId);
  }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return { status: 'up', service: 'notification-service' };
  }
}
