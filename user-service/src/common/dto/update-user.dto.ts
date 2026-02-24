import { IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  address: string;
}
