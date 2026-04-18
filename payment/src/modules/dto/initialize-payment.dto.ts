import { IsEmail, IsUUID } from 'class-validator';

export class InitializePaymentDto {
  @IsUUID()
  orderId: string = '';

  @IsEmail()
  email: string = '';

  @IsUUID()
  idempotencyKey: string = '';
}
