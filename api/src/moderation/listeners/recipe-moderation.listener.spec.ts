import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { RecipeModerationListener } from './recipe-moderation.listener';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { RecipeStatusEnum } from '../../recipe/enums/recipe-status.enum';

describe('RecipeModerationListener', () => {
  let listener: RecipeModerationListener;
  let moderationQueue: { add: jest.Mock };

  beforeEach(async () => {
    moderationQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeModerationListener,
        {
          provide: getQueueToken('recipe-premoderation'),
          useValue: moderationQueue,
        },
      ],
    }).compile();

    listener = module.get<RecipeModerationListener>(RecipeModerationListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add recipe to moderationQueue when recipe status is PREMODERATION (direct payload)', async () => {
    const recipe = {
      id: 'rec-123',
      title: 'Salad',
      status: RecipeStatusEnum.PREMODERATION,
    } as Recipe;

    await listener.handleRecipeModeration(recipe);

    expect(moderationQueue.add).toHaveBeenCalledWith(
      'moderate-recipe',
      { recipeId: 'rec-123' },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  });

  it('should add recipe to queue when payload is wrapped in object { recipe, isContentChanged }', async () => {
    const recipe = {
      id: 'rec-456',
      title: 'Steak',
      status: RecipeStatusEnum.PREMODERATION,
    } as Recipe;

    await listener.handleRecipeModeration({
      recipe,
      isContentChanged: true,
    });

    expect(moderationQueue.add).toHaveBeenCalledWith(
      'moderate-recipe',
      { recipeId: 'rec-456' },
      expect.objectContaining({ attempts: 5 }),
    );
  });

  it('should NOT add recipe to queue if status is PUBLIC', async () => {
    const recipe = {
      id: 'rec-789',
      title: 'Public Cake',
      status: RecipeStatusEnum.PUBLIC,
    } as Recipe;

    await listener.handleRecipeModeration(recipe);

    expect(moderationQueue.add).not.toHaveBeenCalled();
  });

  it('should NOT add recipe to queue if status is DRAFT or REJECTED', async () => {
    const draftRecipe = {
      id: 'rec-draft',
      status: RecipeStatusEnum.DRAFT,
    } as Recipe;

    await listener.handleRecipeModeration(draftRecipe);

    expect(moderationQueue.add).not.toHaveBeenCalled();
  });
});
