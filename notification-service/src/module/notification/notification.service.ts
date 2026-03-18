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
    const existing = await this.notifRepo.findOne({
      where: {
        recipientId: payload.recipientId,
        type: payload.type,
        channel: payload.channel,
        correlationId: payload.correlationId,
        status: NotificationStatus.SENT,
      },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate notification skipped: ${payload.type} for ${payload.recipientId}`,
      );
      return;
    }
    const { title, message } = getNotificationTemplate(
      payload.type,
      payload.recipientType,
      payload.metadata,
    );
    this.logger.log(`METADATA IN: ${JSON.stringify(payload.metadata)}`);

    const notification = this.notifRepo.create({
      recipientId: payload.recipientId,
      recipientType: payload.recipientType,
      type: payload.type,
      channel: payload.channel,
      correlationId: payload.correlationId,
      title,
      message,
      metadata: payload.metadata,
      status: NotificationStatus.PENDING,
    });

    const saved = await this.notifRepo.save(notification);
    this.logger.log(`SAVED METADATA: ${JSON.stringify(saved.metadata)}`);
    await this.dispatch(saved);
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
      email: string;
      firstName: string;
      otp: string;
      verificationLink: string;
    };
    console.log('Verfication Link Meta Details', meta);

    await this.mailService.sendMail({
      to: meta.email,
      subject: notification.title,
      firstName: meta.firstName,
      otp: meta.otp,
      verificationLink: meta.verificationLink,
    });
    console.log('Verfication Link Meta Details', meta);
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

      if (!existing) {
        throw new ConflictException(
          `Notification with ${recipientId} does not exist`,
        );
      }

      return {
        message: 'Recipient Id was found successful',
        Recipient: existing,
      };
    } catch (error) {
      handleErrors(error, this.logger, 'Recipient found');
    }
  }

  async markAsRead(notifId: string, recipientId: string) {
    try {
      const findCheckMark = await this.notifRepo.findOne({
        where: { recipientId },
      });

      if (!findCheckMark) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Marked Item not found',
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
      const updatedMessages = await this.notifRepo.findOne({
        where: { recipientId },
      });
      return {
        message: 'All messages gotten',
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
          message: 'No message has been found',
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
