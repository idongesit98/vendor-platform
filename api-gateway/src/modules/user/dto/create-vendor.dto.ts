import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  password: string;

  // @IsEnum(Role)
  // @IsString()
  // role: Role;

  // @IsBoolean()
  // isVerified: boolean;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  description: string;
}
