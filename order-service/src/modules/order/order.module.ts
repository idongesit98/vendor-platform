import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem } from '../entities';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MENU_SERVICE } from '@/common/utils/const';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.register([
      {
        name: MENU_SERVICE,
        transport: Transport.TCP,
        options: {
          host: process.env.MENU_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.MENU_SERVICE_PORT!) || 4001,
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
