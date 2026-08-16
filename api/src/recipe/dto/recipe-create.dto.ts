import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  ArrayNotEmpty,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DifficultyEnum } from '../enums/recipe-difficulty.enum';
import { CookSpeedEnum } from '../enums/recipe-cook-speed.enum';
import { RecipeStatusEnum } from '../enums/recipe-status.enum';
import { CategoryEnum } from '../enums/recipe-category.enum';
import { CuisineEnum } from '../enums/recipe-cuisine.enum';
import { TasteEnum } from '../enums/recipe-taste.enum';

export class CreateRecipeDto {
  @ApiProperty({
    description: 'The title of the recipe',
    example: 'Pasta Carbonara',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'The category of the recipe',
    enum: CategoryEnum,
    example: CategoryEnum.POULTRY,
  })
  @IsEnum(CategoryEnum)
  @IsNotEmpty()
  category: CategoryEnum;

  @ApiPropertyOptional({
    description: 'A short description of the recipe',
    example: 'A classic Italian pasta dish.',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'The list of ingredients',
    example: ['Pasta', 'Eggs', 'Pecorino Romano'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ingredients: string[];

  @ApiProperty({
    description: 'The cooking instructions',
    example: ['Boil water', 'Cook pasta', 'Mix eggs and cheese'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  directions: string[];

  @ApiProperty({
    description: 'The cooking speed',
    enum: CookSpeedEnum,
    example: CookSpeedEnum.FAST,
  })
  @IsEnum(CookSpeedEnum)
  cookSpeed: CookSpeedEnum;

  @ApiProperty({
    description: 'Preparation time in minutes',
    example: 10,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prepTime: number;

  @ApiProperty({
    description: 'Cooking time in minutes',
    example: 15,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cookTime: number;

  @ApiProperty({
    description: 'The difficulty level',
    enum: DifficultyEnum,
    example: DifficultyEnum.EASY,
  })
  @IsEnum(DifficultyEnum)
  difficulty: DifficultyEnum;

  @ApiPropertyOptional({
    description: 'The list of cuisines',
    enum: CuisineEnum,
    isArray: true,
  })
  @IsArray()
  @IsEnum(CuisineEnum, { each: true })
  @IsOptional()
  cuisineList: CuisineEnum[];

  @ApiPropertyOptional({
    description: 'The taste profile',
    enum: TasteEnum,
    isArray: true,
  })
  @IsArray()
  @IsEnum(TasteEnum, { each: true })
  @IsOptional()
  tastes: TasteEnum[];

  @ApiProperty({
    description: 'List of ingredients for search optimization',
    example: ['pasta', 'egg', 'cheese'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ingredientsSearch: string[];

  @ApiPropertyOptional({
    description: 'Whether the recipe is vegan',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isVegan: boolean;

  @ApiPropertyOptional({
    description: 'Whether the recipe is vegetarian',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isVegetarian: boolean;

  @ApiPropertyOptional({
    description: 'Whether the recipe is gluten-free',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isGluten_free: boolean;

  @ApiPropertyOptional({
    description: 'Whether the recipe is halal',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isHalal: boolean;

  @ApiPropertyOptional({
    description: 'Whether the recipe is kosher',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isKosher: boolean;

  @ApiPropertyOptional({
    description: 'Whether the recipe is dairy-free',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isDairyFree: boolean;

  @ApiPropertyOptional({
    description: 'Whether the recipe is nut-free',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isNutFree: boolean;

  @ApiPropertyOptional({
    description: 'The health score of the recipe',
    example: 80,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  healthScore: number;

  @ApiPropertyOptional({
    description: 'The status of the recipe',
    enum: [RecipeStatusEnum.DRAFT, RecipeStatusEnum.PREMODERATION],
    example: RecipeStatusEnum.DRAFT,
  })
  @IsOptional()
  @IsIn([RecipeStatusEnum.DRAFT, RecipeStatusEnum.PREMODERATION], {
    message: 'Status must be either DRAFT or PREMODERATION',
  })
  status?: RecipeStatusEnum;

  @ApiPropertyOptional({
    description: 'The ID of the cover image',
    example: 'img-123',
  })
  @IsOptional()
  @IsString()
  coverImageId?: string;

  @ApiPropertyOptional({
    description: 'The IDs of the gallery images',
    example: ['img-456', 'img-789'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImageIds?: string[];

  @ApiPropertyOptional({
    description: 'The YouTube video URL',
    example: 'https://youtube.com/watch?v=...',
  })
  @IsString()
  @IsOptional()
  youtubeVideoUrl?: string;
}
