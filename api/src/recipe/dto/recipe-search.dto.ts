import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { DifficultyEnum } from '../../recipe/enums/recipe-difficulty.enum';
import { CookSpeedEnum } from '../../recipe/enums/recipe-cook-speed.enum';
import { Type, Transform } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';
import { IsGreaterThan } from '../../shared/decorators/is-greater-than.decorator';
import { RecipeStatusEnum } from '../enums/recipe-status.enum';
import { CategoryEnum } from '../../recipe/enums/recipe-category.enum';
import { CuisineEnum } from '../../recipe/enums/recipe-cuisine.enum';

export class RecipeSearchDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search query for recipe title or description',
    example: 'Pasta',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: CategoryEnum,
  })
  @IsOptional()
  @IsEnum(CategoryEnum)
  category?: CategoryEnum;

  @ApiPropertyOptional({
    description: 'Filter by cuisines',
    enum: CuisineEnum,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').filter(Boolean);
    return [value];
  })
  @IsArray()
  @IsEnum(CuisineEnum, { each: true })
  cuisineList?: CuisineEnum[];

  @ApiPropertyOptional({ description: 'Filter for vegetarian recipes' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVegetarian?: boolean;

  @ApiPropertyOptional({ description: 'Filter for vegan recipes' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVegan?: boolean;

  @ApiPropertyOptional({ description: 'Filter for gluten-free recipes' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isGluten_free?: boolean;

  @ApiPropertyOptional({ description: 'Filter for halal recipes' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHalal?: boolean;

  @ApiPropertyOptional({ description: 'Filter for kosher recipes' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isKosher?: boolean;

  @ApiPropertyOptional({ description: 'Filter for dairy-free recipes' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDairyFree?: boolean;

  @ApiPropertyOptional({ description: 'Filter for nut-free recipes' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isNutFree?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by difficulty level',
    enum: DifficultyEnum,
  })
  @IsOptional()
  @IsEnum(DifficultyEnum)
  difficulty?: DifficultyEnum;

  @ApiPropertyOptional({
    description: 'Filter by cooking speed',
    enum: CookSpeedEnum,
  })
  @IsOptional()
  @IsEnum(CookSpeedEnum)
  cookSpeed?: CookSpeedEnum;

  @ApiPropertyOptional({
    description: 'Filter by maximum cooking time in minutes',
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxCookTime?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum health score',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(100)
  @Min(0)
  minHealthScore?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum health score',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(100)
  @Min(0)
  @IsGreaterThan('minHealthScore', {
    message: 'maxHealthScore cannot be less than minHealthScore',
  })
  maxHealthScore?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum rating',
    example: 4,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(5)
  @Min(0)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum rating',
    example: 5,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(5)
  @Min(0)
  @IsGreaterThan('minRating', {
    message: 'maxRating cannot be less than minRating',
  })
  maxRating?: number;

  @ApiPropertyOptional({
    description: 'Filter by recipe status',
    enum: RecipeStatusEnum,
  })
  @IsOptional()
  @IsEnum(RecipeStatusEnum)
  status?: RecipeStatusEnum;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'uuid-123',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
