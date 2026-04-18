import { CurrentUser } from '@/common/decorators';
import {
  ApiSuccessResponse,
  SwaggerResponses,
} from '@/common/decorators/swagger';
import { RecipientType, Role } from '@/common/enums';
import { JwtAuthGuard } from '@/common/guards';
import { NOTIFICATION_SERVICE, sendToService } from '@/common/utils';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_SERVICE) private readonly client: ClientProxy,
  ) {}

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all notifications on the queue' })
  @ApiSuccessResponse({
    status: 200,
    description: 'All notifications for a user',
  })
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all unread notifications' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Get all unread notifications for a particular recipient',
  })
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  getUnRead(@CurrentUser('sub') recipientId: string) {
    return sendToService(
      this.client,
      { cmd: 'notification.unReadCount' },
      recipientId,
    );
  }

  @Patch('read/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all unread notifications' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Get all unread notifications for a particular recipient',
  })
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all read notifications for a recipient' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Get all unread notifications for a particular recipient',
  })
  @ApiResponse(SwaggerResponses.notFound)
  @ApiResponse(SwaggerResponses.internalServerError)
  allRead(@CurrentUser('sub') recipientId: string) {
    return sendToService(
      this.client,
      { cmd: 'notification.markAllAsRead' },
      recipientId,
    );
  }
}
