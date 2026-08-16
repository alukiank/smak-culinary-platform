import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RecipeService } from '../../recipe/recipe.service';
import { RecipeReviewService } from '../../recipe-review/recipe-review.service';
import { User } from '../entities/user.entity';

@Injectable()
export class UserBanListener {
  private readonly logger = new Logger(UserBanListener.name);

  constructor(
    private readonly recipeService: RecipeService,
    private readonly recipeReviewService: RecipeReviewService,
  ) {}

  @OnEvent('user.updated')
  async handleUserUpdated(user: User) {
    if (user.isBanned) {
      this.logger.log(
        `[User] User ${user.id} has been banned. Initiating content ban.`,
      );
      await Promise.all([
        this.recipeService.banRecipesByUser(user.id),
        this.recipeReviewService.banReviewsByUser(user.id),
      ]);
    }
  }
}
