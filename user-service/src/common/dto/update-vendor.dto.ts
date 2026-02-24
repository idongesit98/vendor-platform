import { IsString } from 'class-validator';

export class UpdateVendor {
  @IsString()
  businessName: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  description: string;
}
