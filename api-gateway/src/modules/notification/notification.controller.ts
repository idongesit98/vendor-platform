import { CurrentUser } from '@/common/decorators';
import { RecipientType, Role } from '@/common/enums';
import { JwtAuthGuard } from '@/common/guards';
import { NOTIFICATION_SERVICE, sendToService } from '@/common/utils';
import {
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_SERVICE) private readonly client: ClientProxy,
  ) {}

  @Get('all')
  getMyNotifications(
    @CurrentUser('sub') recipientId: string,
    @CurrentUser('role') role: Role,
  ) {
    const recipientType =
      role === Role.VENDOR ? RecipientType.VENDOR : RecipientType.USER;
    return sendToService(
      this.client,
      { cmd: 'notification.findByRecipient' },
      { recipientId, recipientType },
    );
  }

  @Get('unread')
  getUnRead(@CurrentUser('sub') recipientId: string) {
    return sendToService(
      this.client,
      { cmd: 'notification.unReadCount' },
      recipientId,
    );
  }

  @Patch('read/:id')
  markRead(
    @Param('id') notifId: string,
    @CurrentUser('sub') recipientId: string,
  ) {
    return sendToService(
      this.client,
      { cmd: 'notification.markAsRead' },
      { notifId, recipientId },
    );
  }

  @Patch('read/all')
  allRead(@CurrentUser('sub') recipientId: string) {
    return sendToService(
      this.client,
      { cmd: 'notification.markAllAsRead' },
      recipientId,
    );
  }
}
