import { IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsString()
  userId: string;

  @IsNumber()
  menuItemId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
