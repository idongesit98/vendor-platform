import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;
}
