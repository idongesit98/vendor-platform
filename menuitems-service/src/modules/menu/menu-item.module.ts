import { Module } from '@nestjs/common';
import { MenuItemController } from './menu-item.controller';
import { MenuItemService } from './menu-item.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem, UserOrder } from '../entities';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, UserOrder]),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.USER_SERVICE_PORT!) || 4000,
        },
      },
    ]),
  ],
  controllers: [MenuItemController],
  providers: [MenuItemService],
})
export class MenuItemModule {}
