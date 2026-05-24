import { Module } from '@nestjs/common';
import { MenuItemModule } from '@modules/menu/menu-item.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './common/config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from '@common/config/validation.schema';
import { HealthModule } from '@common/health/health.module';
import { CategoryModule } from '@modules/category/category.module';
import { LoggerModule } from 'nestjs-pino';
import { microserviceLoggerConfig } from '@common/config/microservice.logger';

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
    LoggerModule.forRoot(microserviceLoggerConfig('MenuItem-Service')),
    HealthModule,
    CategoryModule,
    MenuItemModule,
  ],
})
export class AppModule {}
