import { OrderStatus } from '@/modules/order/enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: OrderStatus.PENDING,
    description: 'Status of the order',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
