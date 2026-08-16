import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DifficultyEnum } from '../enums/recipe-difficulty.enum';
import { CookSpeedEnum } from '../enums/recipe-cook-speed.enum';
import { RecipeStatusEnum } from '../enums/recipe-status.enum';
import { UserPublicDto } from '../../user/dto/user-public.dto';
import { CategoryEnum } from '../enums/recipe-category.enum';
import { CuisineEnum } from '../enums/recipe-cuisine.enum';
import { TasteEnum } from '../enums/recipe-taste.enum';

export class RecipeResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the recipe',
    example: 'uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The title of the recipe',
    example: 'Pasta Carbonara',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'The category of the recipe',
    enum: CategoryEnum,
    example: CategoryEnum.POULTRY,
  })
  @Expose()
  category: CategoryEnum;

  @ApiProperty({ description: 'A short description of the recipe' })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'The list of ingredients',
    example: ['Pasta', 'Eggs', 'Cheese'],
  })
  @Expose()
  ingredients: string[];

  @ApiProperty({
    description: 'The cooking instructions',
    example: ['Boil water', 'Cook pasta'],
  })
  @Expose()
  directions: string[];

  @ApiProperty({
    description: 'The cooking speed',
    enum: CookSpeedEnum,
    example: CookSpeedEnum.FAST,
  })
  @Expose()
  cookSpeed: CookSpeedEnum;

  @ApiProperty({ description: 'Preparation time in minutes', example: 10 })
  @Expose()
  prepTime: number;

  @ApiProperty({ description: 'Cooking time in minutes', example: 15 })
  @Expose()
  cookTime: number;

  @ApiProperty({
    description: 'The difficulty level',
    enum: DifficultyEnum,
    example: DifficultyEnum.EASY,
  })
  @Expose()
  difficulty: DifficultyEnum;

  @ApiProperty({
    description: 'The list of cuisines',
    enum: CuisineEnum,
    isArray: true,
  })
  @Expose()
  cuisineList: CuisineEnum[];

  @ApiProperty({
    description: 'The taste profile',
    enum: TasteEnum,
    isArray: true,
  })
  @Expose()
  tastes: TasteEnum[];

  @ApiProperty({ description: 'Whether the recipe is vegan' })
  @Expose()
  isVegan: boolean;

  @ApiProperty({ description: 'Whether the recipe is vegetarian' })
  @Expose()
  isVegetarian: boolean;

  @ApiProperty({ description: 'Whether the recipe is gluten-free' })
  @Expose()
  isGluten_free: boolean;

  @ApiProperty({ description: 'Whether the recipe is halal' })
  @Expose()
  isHalal: boolean;

  @ApiProperty({ description: 'Whether the recipe is kosher' })
  @Expose()
  isKosher: boolean;

  @ApiProperty({ description: 'Whether the recipe is dairy-free' })
  @Expose()
  isDairyFree: boolean;

  @ApiProperty({ description: 'Whether the recipe is nut-free' })
  @Expose()
  isNutFree: boolean;

  @ApiProperty({ description: 'The health score of the recipe', example: 85 })
  @Expose()
  healthScore: number;

  @ApiProperty({ description: 'When the recipe was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'When the recipe was last updated' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'The current status of the recipe',
    enum: RecipeStatusEnum,
    example: RecipeStatusEnum.PUBLIC,
  })
  @Expose()
  status: RecipeStatusEnum;

  @ApiProperty({
    description: 'The average rating of the recipe',
    example: 4.5,
  })
  @Expose()
  rating: number;

  @ApiProperty({ description: 'The number of ratings', example: 10 })
  @Expose()
  numRatings: number;

  @ApiProperty({ description: 'The ID of the cover image', example: 'img-123' })
  @Expose()
  coverImageId: string;

  @ApiProperty({
    description: 'The IDs of the gallery images',
    example: ['img-456', 'img-789'],
  })
  @Expose()
  galleryImageIds: string[];

  @ApiProperty({
    description: 'The YouTube video URL',
    example: 'https://youtube.com/watch?v=...',
  })
  @Expose()
  youtubeVideoUrl: string;

  @ApiProperty({
    description: 'The author of the recipe',
    type: () => UserPublicDto,
  })
  @Expose()
  @Type(() => UserPublicDto)
  user: UserPublicDto;
}
