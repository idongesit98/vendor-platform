import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({
    example: '123g-dyw4j-didi-idjd....',
    description: 'The menuId created',
  })
  @IsUUID()
  menuItemId: string;

  @ApiProperty({ example: 3, description: 'Quantity ordered' })
  @IsInt()
  @Min(1)
  quantity: number;
}
