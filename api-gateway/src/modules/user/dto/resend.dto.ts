import { IsNotEmpty, IsString } from 'class-validator';

export class ResendOtp {
  @IsString()
  @IsNotEmpty()
  email: string = '';
}
