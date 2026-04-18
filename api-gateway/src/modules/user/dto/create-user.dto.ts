import { Role } from '@/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Hiliary', description: 'Firstname of the User' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Clinton', description: 'Lastname of the User' })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'clinton@example.com',
    description: 'Email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123aPI',
    description: 'Password of the user',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: Role.CUSTOMER, description: 'Role of the new user' })
  @IsEnum(Role)
  @IsOptional()
  role: Role;

  @ApiProperty({ example: false, description: 'Is the person an active user' })
  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @ApiProperty({
    example: false,
    description: 'Has the user email being verified',
  })
  @IsBoolean()
  @IsOptional()
  emailVerfied: boolean = false;
}
