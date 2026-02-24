import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  // @IsEnum(Role)
  // role: Role;
  // @IsBoolean()
  // isActive: boolean;
  // @IsBoolean()
  // emailVerfied: boolean;
}
