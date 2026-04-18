import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    example: 'clinton@example.com',
    description: 'Use the verified email used on creation of account',
  })
  @IsString()
  @IsNotEmpty()
  email: string = '';

  @ApiProperty({
    example: 'password123',
    description: 'Use same password as creation of account',
  })
  @IsString()
  @IsNotEmpty()
  password: string = '';
}
