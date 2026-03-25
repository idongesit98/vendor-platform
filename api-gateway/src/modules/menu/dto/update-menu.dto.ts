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

export class UpdateMenuDto {
  @ApiProperty({
    example: 'Hot Jollof Rice',
    description: 'Edit the name of the meal',
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Smokey', description: 'Edit the meal description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2600, description: 'Update the price list' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: '1223-hd231-h2891-...',
    description: 'Edit the meal category',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: '', description: 'Update the image url' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 15, description: 'Edit the preparartion time' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  prepTime?: number;

  @ApiProperty({ example: true, description: 'Is the food available' })
  @IsBoolean()
  isAvailable: boolean;
}
