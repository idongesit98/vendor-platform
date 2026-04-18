import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { AppClientsModule } from '../clients/client.module';

@Module({
  imports: [AppClientsModule],
  controllers: [PaymentController],
})
export class PaymentModule {}
