import { CreateNotificationPayload } from '@/common/utils/interface/notif-payload';
import { Notification } from '@/entities';
import {
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getNotificationTemplate } from '../services';
import {
  NotificationChannel,
  NotificationStatus,
  RecipientType,
} from '@/common/utils/enum';
import { handleErrors } from '@/common/utils';
import { RpcException } from '@nestjs/microservices';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name, {
    timestamp: true,
  });
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    private mailService: MailService,
  ) {}

  async createAndSend(payload: CreateNotificationPayload) {
    const { title, message } = getNotificationTemplate(
      payload.type,
      payload.recipientType,
      payload.metadata,
    );

    this.logger.log(`METADATA IN: ${JSON.stringify(payload.metadata)}`);

    const correlationId =
      payload.correlationId ||
      `${payload.recipientId}:${payload.type}:${payload.channel}`;

    try {
      const existing = await this.notifRepo.findOne({
        where: {
          recipientId: payload.recipientId,
          type: payload.type,
          channel: payload.channel,
          correlationId,
        },
      });

      if (existing) {
        this.logger.warn(
          `Duplicate notification skipped: ${payload.type} for ${payload.recipientId}`,
        );
        return;
      }

      const notification = this.notifRepo.create({
        recipientId: payload.recipientId,
        recipientType: payload.recipientType,
        type: payload.type,
        channel: payload.channel,
        correlationId,
        title,
        message,
        metadata: payload.metadata,
        status: NotificationStatus.PENDING,
      });

      const saved = await this.notifRepo.save(notification);

      if (!saved) {
        this.logger.error(
          `Notification record missing after insert: ${payload.type} for ${payload.recipientId}`,
        );
        return;
      }
      this.logger.log(`Saved METADATA: ${JSON.stringify(saved.metadata)}`);
      await this.dispatch(saved);
    } catch (error) {
      this.logger.log(
        `Notification creation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async dispatch(notification: Notification) {
    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification);
          break;

        case NotificationChannel.IN_APP:
          // eslint-disable-next-line @typescript-eslint/await-thenable
          await this.sendInApp(notification);
          break;

        case NotificationChannel.PUSH:
          // eslint-disable-next-line @typescript-eslint/await-thenable
          await this.sendPush(notification);
          break;
      }

      await this.notifRepo.update(notification.id, {
        status: NotificationStatus.SENT,
      });

      this.logger.log(
        `Notification sent: ${notification.type} to ${notification.recipientId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.notifRepo.update(notification.id, {
        status: NotificationStatus.FAILED,
        errorMessage: message,
      });
      this.logger.error(
        `Notification failed: ${notification.type} to ${notification.recipientId}`,
      );
      handleErrors(error, this.logger, 'Notification Failed');
    }
  }

  /**
   *
   * @private sendEmail will later handle sending emails using nodemailer
   * @private sendInApp will handle codes for sending SSE
   * @private sendPush will handle codes for sending push messages using FCM
   */

  private async sendEmail(notification: Notification) {
    this.logger.log(
      `[EMAIL] To: ${notification.recipientId} | ${notification.title}`,
    );
    const meta = notification.metadata as {
      role: 'user' | 'vendor';
      email: string;
      firstName?: string;
      lastName?: string;
      businessName?: string;
      otp?: string;
      verificationLink?: string;
    };
    console.log('Verfication Link Meta Details', meta);

    const mailPayload = {
      to: meta.email,
      subject: notification.title,
      otp: meta.otp,
      verificationLink: meta.verificationLink,
      type: meta.role,
      ...(meta.role === 'user'
        ? { firstName: meta.firstName }
        : { businessName: meta.businessName }),
    };
    this.logger.log(`Sending email to: ${meta.email} as ${meta.role}`);
    await this.mailService.sendMail(mailPayload);
  }

  private sendInApp(notification: Notification) {
    this.logger.log(
      `[IN_APP] To: ${notification.recipientId} | ${notification.title}`,
    );
  }

  private sendPush(notification: Notification) {
    this.logger.log(
      `[PUSH] To: ${notification.recipientId} | ${notification.title}`,
    );
  }

  async findByRecipient(recipientId: string, recipientType: RecipientType) {
    try {
      const existing = await this.notifRepo.find({
        where: { recipientId, recipientType },
        order: { createdAt: 'DESC' },
        take: 50,
      });

      if (!existing || existing.length === 0) {
        throw new ConflictException(
          `Notification with ${recipientId} does not exist`,
        );
      }

      return {
        message: 'Recipient notifications was found successful',
        Recipient: existing,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Find by recipient failed');
    }
  }

  async markAsRead(notifId: string, recipientId: string) {
    try {
      const findCheckMark = await this.notifRepo.findOne({
        where: { id: notifId, recipientId },
      });

      if (!findCheckMark) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Marked notification not found',
        });
      }

      await this.notifRepo.update(
        { id: notifId, recipientId },
        { isRead: true, readtAt: new Date() },
      );

      const updatedMessage = await this.notifRepo.findOne({
        where: { id: notifId },
      });

      return {
        message: 'Message marked read',
        Updated: updatedMessage,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Error updating messages');
    }
  }

  async markAllAsRead(recipientId: string) {
    try {
      const findMessage = await this.notifRepo.findOne({
        where: { recipientId },
      });

      if (!findMessage) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Messages not found',
        });
      }
      await this.notifRepo.update(
        { recipientId, isRead: false },
        { isRead: true, readtAt: new Date() },
      );
      const updatedMessages = await this.notifRepo.find({
        where: { recipientId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      return {
        message: 'All mark as read messages gotten',
        Updated: updatedMessages,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Error updating All messages');
    }
  }

  async getUnReadCount(recipientId: string) {
    try {
      const existingMessage = await this.notifRepo.findOne({
        where: { recipientId },
      });

      if (!existingMessage) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'No message has been found for this recipient',
        });
      }

      const count = await this.notifRepo.count({
        where: { recipientId, isRead: false },
      });

      return {
        message: 'Unread message found',
        Unread: count,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Unable to get unread messaged');
    }
  }
}
