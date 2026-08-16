import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRecipeReviewDto {
  @ApiProperty({
    description: 'The rating given to the recipe',
    example: 5,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  @Max(5)
  @Min(0)
  rating: number;

  @ApiPropertyOptional({
    description: 'The review text',
    example: 'Amazing recipe! My family loved it.',
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({
    description: 'The ID of an optional image for the review',
    example: 'img-123',
  })
  @IsString()
  @IsOptional()
  imageId?: string;
}
