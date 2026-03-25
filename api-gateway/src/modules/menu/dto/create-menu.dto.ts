import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ example: 'Jollof Rice', description: 'Name of the food' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Hot smokey jollof rice with aroma that lingers for days',
    description: 'Describe the food in a tasty pleasing way',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2000, description: 'Price of the meal' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: '1233-eu2993......',
    description: 'The category id created in UUID',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: '', description: 'The URL of the uploaded image' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 30, description: 'Time taken to prep and delivery' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  prepTime?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable: boolean;
}
