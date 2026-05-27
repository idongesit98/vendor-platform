import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from '@modules/payment/payment.module';
import { HealthModule } from '@health/health.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './common/config/configuration';
import { LoggerConfig, validationSchema } from '@common/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { IdempotencyModule } from './idempotency/idempotency.module';
import KeyvRedis from '@keyv/redis';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          ...(isProduction
            ? {
                url: configService.get<string>('url.database'),
                ssl: {
                  rejectUnauthorized: false,
                },
              }
            : {
                host: configService.get<string>('database.host'),
                port: configService.get<number>('database.port'),
                username: configService.get<string>('database.username'),
                password: configService.get<string>('database.password'),
                database: configService.get<string>('database.name'),
              }),
          autoLoadEntities: true,
          synchronize: !isProduction,
          migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
          migrationsRun: true,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        console.log('=== CACHE MODULE FACTORY EXECUTING ===');
        const host = configService.get<string>('redis.host');
        const port = configService.get<number>('redis.port');
        const password = configService.get<string>('redis.password');
        return {
          stores: [new KeyvRedis(`redis://:${password}@${host}:${port}`)],
        };
      },
      inject: [ConfigService],
    }),
    LoggerModule.forRoot(LoggerConfig('Payment-Service')),
    PaymentModule,
    HealthModule,
    IdempotencyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
