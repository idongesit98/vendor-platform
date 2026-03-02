import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenuItemModule } from './modules/menu/menu-item.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './common/config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from './common/config/validation.schema';
import { HealthModule } from './common/health/health.module';
import { CategoryModule } from './modules/category/category.module';
import { LoggerModule } from './common/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: true,
        migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
        migrationsRun: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    LoggerModule,
    HealthModule,
    CategoryModule,
    MenuItemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
