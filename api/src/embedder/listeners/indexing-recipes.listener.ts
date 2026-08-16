import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { RecipeStatusEnum } from '../../recipe/enums/recipe-status.enum';

@Injectable()
export class IndexingRecipesListenerService {
  private readonly logger = new Logger(IndexingRecipesListenerService.name);

  constructor(
    @InjectQueue('recipe-indexing') private readonly embeddingQueue: Queue,
  ) {}

  @OnEvent('recipe.status.changed')
  async handleStatusChange(recipe: Recipe) {
    if (recipe.status === RecipeStatusEnum.PUBLIC) {
      this.logger.log(
        `[Indexing] Recipe "${recipe.title}" (${recipe.id}) status changed to PUBLIC. Queueing for embedding.`,
      );
      await this.addIndexingJob(recipe);
    }
  }

  @OnEvent('recipe.updated')
  async handleRecipeUpdate(payload: {
    recipe: Recipe;
    isContentChanged: boolean;
  }) {
    if (
      payload.recipe.status === RecipeStatusEnum.PUBLIC &&
      payload.isContentChanged
    ) {
      this.logger.log(
        `[Indexing] Recipe "${payload.recipe.title}" (${payload.recipe.id}) content updated. Re-queueing for embedding.`,
      );
      await this.addIndexingJob(payload.recipe);
    }
  }

  private async addIndexingJob(recipe: Recipe) {
    const ingredientsText = recipe.ingredients?.join(', ') || '';
    const textToEmbed = `${recipe.title}. ${recipe.description || ''}. Ingredients: ${ingredientsText}`;

    await this.embeddingQueue.add(
      'generate-vector',
      {
        recipeId: recipe.id,
        text: textToEmbed,
        title: recipe.title || undefined,
      },
      {
        attempts: 10,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }
}
