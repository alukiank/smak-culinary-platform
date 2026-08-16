import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { RecipeStatusEnum } from '../../recipe/enums/recipe-status.enum';

@Injectable()
export class RecipeModerationListener {
  private readonly logger = new Logger(RecipeModerationListener.name);

  constructor(
    @InjectQueue('recipe-premoderation')
    private readonly moderationQueue: Queue,
  ) {}

  @OnEvent('recipe.created')
  @OnEvent('recipe.updated')
  @OnEvent('recipe.status.changed')
  async handleRecipeModeration(
    payload: Recipe | { recipe: Recipe; isContentChanged: boolean },
  ) {
    const recipe = 'recipe' in payload ? payload.recipe : payload;

    if (recipe.status === RecipeStatusEnum.PREMODERATION) {
      this.logger.log(
        `[Moderation] Recipe "${recipe.title}" (${recipe.id}) needs moderation. Adding to queue.`,
      );
      await this.moderationQueue.add(
        'moderate-recipe',
        { recipeId: recipe.id },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }
  }
}
