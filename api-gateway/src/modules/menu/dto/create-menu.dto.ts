import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  category: string;

  @IsBoolean()
  isAvailable: boolean;
}
