import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    example: 'Tasty Soups',
    description: 'Edit the name of the meal you created',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'smokey',
    description: 'Edit the description provided',
  })
  @IsString()
  @IsOptional()
  description: string;
}
