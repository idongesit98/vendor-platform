import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationModule } from './module/notification/notification.module';
import { HealthModule } from '@common/health/health.module';
import configuration from './common/config/configuration';
import { validationSchema } from '@common/config/validation.schema';
import { MailModule } from './module/mail/mail.module';
import { LoggerModule } from 'nestjs-pino';
import { LoggerConfig } from '@common/config/microservice.logger';

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
                url: configService.get<string>('database.url'),
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
    LoggerModule.forRoot(LoggerConfig('Notification-Service')),
    NotificationModule,
    HealthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
