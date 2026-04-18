import { Notification } from '@/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { MailService } from '../mail/mail.service';
import { DlqConsumer } from './dlq.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationController, DlqConsumer],
  providers: [NotificationService, MailService],
})
export class NotificationModule {}
