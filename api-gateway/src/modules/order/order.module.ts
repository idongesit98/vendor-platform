import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { AppClientsModule } from '../clients/client.module';

@Module({
  imports: [AppClientsModule],
  controllers: [OrderController],
})
export class OrderModule {}
