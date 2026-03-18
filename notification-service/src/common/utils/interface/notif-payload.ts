import {
  NotificationChannel,
  NotificationType,
  RecipientType,
} from '../enum/notifications';

export interface CreateNotificationPayload {
  recipientId: string;
  recipientType: RecipientType;
  type: NotificationType;
  channel: NotificationChannel;
  correlationId: string;
  metadata: Record<string, unknown>;
}
