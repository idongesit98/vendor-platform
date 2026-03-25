import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from '@/modules/menu/dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    type: [CreateOrderItemDto],
    example: [
      {
        menuItemId: '135baebe-eed3-4224-a426-d437d7af6a90',
        quantity: 2,
      },
    ],
    description: 'List of order items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    example: 'Please deliver before 5pm',
    description: 'Optional notes for the order',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
