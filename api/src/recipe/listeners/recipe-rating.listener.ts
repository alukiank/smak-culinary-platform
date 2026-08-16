import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RecipeService } from '../recipe.service';

@Injectable()
export class RecipeRatingListener {
  constructor(private readonly recipeService: RecipeService) { }

  @OnEvent('recipe-review.created')
  @OnEvent('recipe-review.updated')
  @OnEvent('recipe-review.deleted')
  @OnEvent('recipe-review.status.changed')
  async handleReviewChangedEvent(payload: { recipeId: string }) {
    await this.recipeService.updateRecipeRating(payload.recipeId);
  }
}
