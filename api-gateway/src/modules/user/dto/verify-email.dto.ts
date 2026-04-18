import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'clinton@example.com',
    description: 'Verfy the email you used on creation',
  })
  @IsEmail()
  email: string = '';

  @ApiProperty({
    example: '123456',
    description: 'Enter the OTP sent to your email',
  })
  @IsString()
  @Length(6, 6)
  emailVerificationOtp: string = '';
}
