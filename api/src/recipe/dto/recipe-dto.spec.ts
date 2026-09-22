import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateRecipeDto } from './recipe-create.dto';
import { CategoryEnum } from '../enums/recipe-category.enum';
import { DifficultyEnum } from '../enums/recipe-difficulty.enum';
import { CookSpeedEnum } from '../enums/recipe-cook-speed.enum';
import { RecipeStatusEnum } from '../enums/recipe-status.enum';

describe('CreateRecipeDto Validation', () => {
  const validData = {
    title: 'Authentic Ukrainian Borscht',
    category: CategoryEnum.SOUPS_AND_STEWS,
    description: 'Hearty beetroot soup',
    ingredients: ['Beetroot', 'Cabbage', 'Potatoes', 'Beef broth'],
    directions: ['Sauté vegetables', 'Simmer broth', 'Add beetroots'],
    cookSpeed: CookSpeedEnum.MEDIUM,
    prepTime: 25,
    cookTime: 60,
    difficulty: DifficultyEnum.MEDIUM,
    ingredientsSearch: ['beetroot', 'cabbage', 'potatoes', 'beef'],
    healthScore: 85,
    status: RecipeStatusEnum.PREMODERATION,
  };

  it('should pass validation with complete valid data', async () => {
    const dto = plainToInstance(CreateRecipeDto, validData);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail if required fields are missing', async () => {
    const dto = plainToInstance(CreateRecipeDto, {});
    const errors = await validate(dto);

    const errorFields = errors.map((err) => err.property);
    expect(errorFields).toContain('title');
    expect(errorFields).toContain('category');
    expect(errorFields).toContain('ingredients');
    expect(errorFields).toContain('directions');
    expect(errorFields).toContain('cookSpeed');
    expect(errorFields).toContain('prepTime');
    expect(errorFields).toContain('cookTime');
    expect(errorFields).toContain('difficulty');
    expect(errorFields).toContain('ingredientsSearch');
  });

  it('should fail if prepTime is negative', async () => {
    const dto = plainToInstance(CreateRecipeDto, {
      ...validData,
      prepTime: -5,
    });
    const errors = await validate(dto);

    const prepTimeError = errors.find((e) => e.property === 'prepTime');
    expect(prepTimeError).toBeDefined();
    expect(prepTimeError?.constraints).toHaveProperty('min');
  });

  it('should fail if healthScore exceeds 100', async () => {
    const dto = plainToInstance(CreateRecipeDto, {
      ...validData,
      healthScore: 105,
    });
    const errors = await validate(dto);

    const healthError = errors.find((e) => e.property === 'healthScore');
    expect(healthError).toBeDefined();
    expect(healthError?.constraints).toHaveProperty('max');
  });

  it('should fail if user tries to directly set status to PUBLIC on creation', async () => {
    const dto = plainToInstance(CreateRecipeDto, {
      ...validData,
      status: RecipeStatusEnum.PUBLIC,
    });
    const errors = await validate(dto);

    const statusError = errors.find((e) => e.property === 'status');
    expect(statusError).toBeDefined();
    expect(statusError?.constraints).toHaveProperty('isIn');
  });

  it('should fail if ingredients array is empty', async () => {
    const dto = plainToInstance(CreateRecipeDto, {
      ...validData,
      ingredients: [],
    });
    const errors = await validate(dto);

    const ingError = errors.find((e) => e.property === 'ingredients');
    expect(ingError).toBeDefined();
    expect(ingError?.constraints).toHaveProperty('arrayNotEmpty');
  });
});
