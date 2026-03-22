import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './modules/payment/payment.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PaymentModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
