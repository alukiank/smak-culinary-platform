import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RecipeAllowedForOwnerGuard } from './recipe-allowed-for-owner.guard';
import { RecipeService } from '../recipe.service';
import { Recipe } from '../entities/recipe.entity';

function createMockContext(user: any, recipeId: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params: { id: recipeId },
      }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RecipeAllowedForOwnerGuard', () => {
  let guard: RecipeAllowedForOwnerGuard;
  let recipeService: { findOne: jest.Mock };

  beforeEach(async () => {
    recipeService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeAllowedForOwnerGuard,
        { provide: RecipeService, useValue: recipeService },
      ],
    }).compile();

    guard = module.get<RecipeAllowedForOwnerGuard>(RecipeAllowedForOwnerGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false if user is not present in request', async () => {
    const context = createMockContext(null, 'rec-1');

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
    expect(recipeService.findOne).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if recipe does not exist', async () => {
    recipeService.findOne.mockResolvedValue(null);
    const context = createMockContext({ id: 'usr-1' }, 'rec-missing');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new NotFoundException('Recipe not found'),
    );
  });

  it('should throw ForbiddenException if user is not the owner of the recipe', async () => {
    const recipe = {
      id: 'rec-1',
      title: 'Pasta',
      user: { id: 'owner-id' },
    } as Recipe;
    recipeService.findOne.mockResolvedValue(recipe);

    const context = createMockContext({ id: 'stranger-id' }, 'rec-1');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You are not the owner of this recipe'),
    );
  });

  it('should allow access if user is the owner of the recipe', async () => {
    const recipe = {
      id: 'rec-1',
      title: 'Pasta',
      user: { id: 'owner-id' },
    } as Recipe;
    recipeService.findOne.mockResolvedValue(recipe);

    const context = createMockContext({ id: 'owner-id' }, 'rec-1');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
