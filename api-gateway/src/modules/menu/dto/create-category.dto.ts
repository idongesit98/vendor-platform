import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Soups',
    description: 'Name of the category you want your foods to be created on',
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Tasty Nigerian from home' })
  @IsString()
  @IsOptional()
  description: string;
}
