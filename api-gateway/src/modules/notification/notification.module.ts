import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { AppClientsModule } from '../clients/client.module';

@Module({
  imports: [AppClientsModule],
  controllers: [NotificationController],
})
export class NotificationModule {}
