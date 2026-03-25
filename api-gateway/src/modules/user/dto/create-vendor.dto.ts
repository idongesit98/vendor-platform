import { Role } from '@/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({
    example: 'Chicken republic',
    description: 'Business name of the vendor',
  })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ example: 'hiliary', description: 'Email of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password of the user' })
  @IsString()
  password: string;

  @ApiProperty({ example: Role.VENDOR, description: 'Role of the user' })
  @IsEnum(Role)
  @IsString()
  @IsOptional()
  role: Role;

  @ApiProperty({
    example: false,
    description: 'Is the email of the user verifed',
  })
  @IsBoolean()
  @IsOptional()
  isVerified: boolean = false;

  @ApiProperty({
    example: '0915322345',
    description: 'Phone number of the user',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    example: '12 Tosin street off Emina Crescent',
    description: 'Address of the vendor',
  })
  @IsString()
  address: string;

  @ApiProperty({
    example: 'Short details about the vendor',
    description: 'Describe the business',
  })
  @IsString()
  description: string;
}
