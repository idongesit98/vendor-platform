import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './common/config/configuration';
import { validationSchema } from '@common/config/validation.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from '@health/health.module';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
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
          connectTimeoutMS: 10000,
          extra: {
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 3000,
            max: 5,
          },
        };
      },
      inject: [ConfigService],
    }),
    LoggerModule.forRoot(LoggerConfig('User-Service')),
    HealthModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
