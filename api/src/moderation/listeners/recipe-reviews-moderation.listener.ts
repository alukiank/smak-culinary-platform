import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RecipeReviewModerationListener {
  private readonly logger = new Logger(RecipeReviewModerationListener.name);

  constructor(
    @InjectQueue('recipe-review-premoderation')
    private readonly moderationQueue: Queue,
  ) {}

  @OnEvent('recipe-review.created')
  @OnEvent('recipe-review.updated')
  async handleRecipeReviewModeration(payload: {
    recipeId: string;
    reviewId: string;
  }) {
    this.logger.log(
      `[Moderation] New review detected (ID: ${payload.reviewId}). Queueing for automated moderation.`,
    );
    await this.moderationQueue.add(
      'moderate-review',
      { reviewId: payload.reviewId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }
}
