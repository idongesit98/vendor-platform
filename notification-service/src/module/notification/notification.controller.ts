import { Controller, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  NotificationChannel,
  NotificationType,
  OrderStatus,
  RecipientType,
} from '@/common/utils/enum';
import { ackMessage, nackWithRetry } from '@/common/utils';

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
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`RAW PAYLOAD: ${JSON.stringify(payload)}`);
      this.logger.log(`Event received and user created - ${payload.email}`);

      //Send Verification Email to User
      await this.notificationService.createAndSend({
        recipientId: payload.email,
        recipientType: RecipientType.USER,
        type: NotificationType.USER_REGISTERED,
        correlationId: `${payload.email}:user:email:registered:${Date.now()}`,
        channel: NotificationChannel.EMAIL,
        metadata: {
          role: 'user',
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          otp: payload.otp,
          verificationLink: payload.verificationLink,
        },
      });
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling user.created event: ${errorMessage}`);
    }
  }

  @EventPattern('vendor.created')
  async handleVendorCreated(
    @Payload()
    payload: {
      businessName: string;
      email: string;
      address: string;
      phone: string;
      otp: string;
      verificationLink: string;
    },
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`RAW PAYLOAD: ${JSON.stringify(payload)}`);
      this.logger.log(`Event received and vendor created - ${payload.email}`);

      await this.notificationService.createAndSend({
        recipientId: payload.email,
        recipientType: RecipientType.VENDOR,
        type: NotificationType.VENDOR_REGISTERED,
        correlationId: `${payload.email}:vendor:email:registered:${Date.now()}`,
        channel: NotificationChannel.EMAIL,
        metadata: {
          role: 'vendor',
          businessName: payload.businessName,
          email: payload.email,
          phone: payload.phone,
          otp: payload.otp,
          verificationLink: payload.verificationLink,
        },
      });
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling vendor.created event: ${errorMessage}`);
    }
  }

  @EventPattern('otp.resend')
  async handleResendOtp(
    @Payload()
    payload: {
      role: 'user' | 'vendor';
      firstName?: string;
      lastName?: string;
      businessName?: string;
      email: string;
      address?: string;
      phone?: string;
      otp: string;
      verificationLink: string;
    },
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`RAW PAYLOAD: ${JSON.stringify(payload)}`);
      this.logger.log(`Event received and vendor created - ${payload.email}`);

      const isVendor = payload.role === 'vendor';
      const recipientType = isVendor
        ? RecipientType.VENDOR
        : RecipientType.USER;

      const notifType = isVendor
        ? NotificationType.VENDOR_OTP_RESENT
        : NotificationType.USER_OTP_RESENT;

      //Resend Otp to User/Vendor
      await this.notificationService.createAndSend({
        recipientId: payload.email,
        recipientType: recipientType,
        type: notifType,
        correlationId: `${payload.email}:${recipientType}:otp-resend:${Date.now()}`,
        channel: NotificationChannel.EMAIL,
        metadata: {
          role: payload.role,
          firstName: payload.firstName,
          lastName: payload.lastName,
          businessName: payload.businessName,
          email: payload.email,
          otp: payload.otp,
          verificationLink: payload.verificationLink,
        },
      });
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling otp.resent event: ${errorMessage}`);
    }
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
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`Event received: Order created - ${payload.orderId}`);
      await this.notificationService.createAndSend({
        recipientId: payload.vendorId,
        recipientType: RecipientType.VENDOR,
        type: NotificationType.ORDER_CREATED,
        channel: NotificationChannel.IN_APP,
        correlationId: `${payload.orderId}:vendor:order-created`,
        metadata: {
          orderId: payload.orderId,
          totalAmount: payload.totalAmount,
        },
      });

      await this.notificationService.createAndSend({
        recipientId: payload.userId,
        recipientType: RecipientType.USER,
        type: NotificationType.ORDER_CREATED,
        correlationId: `${payload.orderId}:user:order-created`,
        channel: NotificationChannel.IN_APP,
        metadata: {
          orderId: payload.orderId,
          totalAmount: payload.totalAmount,
        },
      });
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling order.created event: ${errorMessage}`);
    }
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
    @Ctx() context: RmqContext,
  ) {
    try {
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
      if (!type) {
        this.logger.warn(`Unhandled order status: ${payload.status}`);
        ackMessage(context);
        return;
      }

      await this.notificationService.createAndSend({
        recipientId: payload.userId,
        recipientType: RecipientType.USER,
        type,
        correlationId: `${payload.orderId}:user:${payload.status}`,
        channel: NotificationChannel.IN_APP,
        metadata: { orderId: payload.orderId, status: payload.status },
      });

      await this.notificationService.createAndSend({
        recipientId: payload.vendorId,
        recipientType: RecipientType.VENDOR,
        type,
        correlationId: `${payload.orderId}:vendor:${payload.status}`,
        channel: NotificationChannel.IN_APP,
        metadata: { orderId: payload.orderId, status: payload.status },
      });

      this.logger.log(
        `Order status notification sent: ${payload.orderId} -> ${payload.status}`,
      );
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error handling order.status_updated event: ${errorMessage}`,
      );
    }
  }

  @EventPattern('payment.initiated')
  async handlePaymentInitiated(
    @Payload() payload: { orderId: string; userId: string; amount: string },
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`Event received: payment.initiated - ${payload.orderId}`);
      await this.notificationService.createAndSend({
        recipientId: payload.userId,
        recipientType: RecipientType.USER,
        type: NotificationType.PAYMENT_INITIATED,
        correlationId: `${payload.orderId}:user:payment-initiated`,
        channel: NotificationChannel.IN_APP,
        metadata: { orderId: payload.orderId, amount: payload.amount },
      });
      //Add email later
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error handling payment.initiated event: ${errorMessage}`,
      );
    }
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
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`Event received: payment.completed - ${payload.orderId}`);
      await this.notificationService.createAndSend({
        recipientId: payload.userId,
        recipientType: RecipientType.USER,
        type: NotificationType.PAYMENT_COMPLETED,
        correlationId: `${payload.orderId}:user:payment-completed`,
        channel: NotificationChannel.IN_APP,
        metadata: { orderId: payload.orderId, amount: payload.amount },
      });

      await this.notificationService.createAndSend({
        recipientId: payload.vendorId,
        recipientType: RecipientType.VENDOR,
        type: NotificationType.PAYMENT_COMPLETED,
        correlationId: `${payload.orderId}:vendor:payment-completed`,
        channel: NotificationChannel.IN_APP,
        metadata: { orderId: payload.orderId, amount: payload.amount },
      });
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error handling payment.completed event: ${errorMessage}`,
      );
    }
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(
    @Payload() payload: { orderId: string; userId: string; amount: number },
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`Event received: payment.failed - ${payload.orderId}`);
      await this.notificationService.createAndSend({
        recipientId: payload.userId,
        recipientType: RecipientType.USER,
        type: NotificationType.PAYMENT_FAILED,
        correlationId: `${payload.orderId}:user:payment-failed`,
        channel: NotificationChannel.IN_APP,
        metadata: { orderId: payload.orderId, amount: payload.amount },
      });
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling payment.failed event: ${errorMessage}`);
    }
  }

  @EventPattern('vendor.verified')
  async handleVendorVerified(
    @Payload() payload: { vendorId: string },
    @Ctx() context: RmqContext,
  ) {
    try {
      this.logger.log(`Event received: vendor.verified - ${payload.vendorId}`);

      await this.notificationService.createAndSend({
        recipientId: payload.vendorId,
        recipientType: RecipientType.VENDOR,
        type: NotificationType.VENDOR_VERIFIED,
        correlationId: `${payload.vendorId}:vendor:verified`,
        channel: NotificationChannel.IN_APP,
        metadata: { vendorId: payload.vendorId },
      });
      ackMessage(context);
    } catch (error) {
      nackWithRetry(context);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error handling vendor.verified event: ${errorMessage}`,
      );
    }
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
