import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserPublicDto } from '../../user/dto/user-public.dto';
import { RecipeResponseDto } from '../../recipe/dto/recipe-response.dto';

export class RecipeReviewResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the review',
    example: 'uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'The rating given to the recipe', example: 5 })
  @Expose()
  rating: number;

  @ApiProperty({ description: 'The review text', example: 'Great recipe!' })
  @Expose()
  text: string;

  @ApiProperty({
    description: 'The ID of the review image',
    example: 'img-123',
  })
  @Expose()
  imageId: string;

  @ApiProperty({
    description: 'The number of comments on this review',
    example: 2,
  })
  @Expose()
  commentsCount: number;

  @ApiProperty({ description: 'Whether the review is published' })
  @Expose()
  isPublished: boolean;

  @ApiProperty({ description: 'When the review was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'When the review was last updated' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'The user who wrote the review',
    type: () => UserPublicDto,
  })
  @Expose()
  @Type(() => UserPublicDto)
  user: UserPublicDto;

  @ApiProperty({
    description: 'The recipe being reviewed',
    type: () => RecipeResponseDto,
  })
  @Expose()
  @Type(() => RecipeResponseDto)
  recipe: RecipeResponseDto;
}
