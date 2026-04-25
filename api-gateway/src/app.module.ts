import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { HealthModule } from '@health/health.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from '@config/validation.schema';
import { CorrelationIdMiddleware } from '@common/middleware/correlation-id.middleware';
import { UserModule } from '@modules/user/user.module';
import { MenuModule } from '@modules/menu/menu.module';
import { APP_GUARD } from '@nestjs/core';
import { OrderModule } from '@modules/order/order.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from '@config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule.forRoot(loggerConfig('api-gateway')),
    HealthModule,
    UserModule,
    MenuModule,
    OrderModule,
    NotificationModule,
    PaymentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
