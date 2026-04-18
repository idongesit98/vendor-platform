import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review, User, Vendor } from '@/common/entities';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '@/service/mail/mail.module';
import { StringValue } from 'ms';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from '@/common/utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Vendor, Review]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<StringValue>('jwt.expiresIn') ?? '1d',
        },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('rabbitmq.url') ||
                'amqp://admin:admin@localhost:5672',
            ],
            queue: 'notification_queue',
            queueOptions: {
              durable: true,
              arguments: {
                'x-dead-letter-exchange': 'notification.dlx',
                'x-dead-letter-routing-key': 'notification.dlx',
              },
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
