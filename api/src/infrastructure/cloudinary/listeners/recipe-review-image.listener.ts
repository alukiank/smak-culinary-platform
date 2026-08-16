import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RecipeReviewImageListener {
  private readonly logger = new Logger(RecipeReviewImageListener.name);

  constructor(
    @InjectQueue('cloudinary-cleanup') private readonly cleanupQueue: Queue,
  ) {}

  @OnEvent('recipe-review.deleted')
  async handleReviewDeleted(payload: {
    recipeId: string;
    reviewImageIds?: string[];
  }) {
    if (payload.reviewImageIds && payload.reviewImageIds.length > 0) {
      this.logger.log(
        `Queueing ${payload.reviewImageIds.length} images for isolated review deletion (Recipe: ${payload.recipeId})`,
      );

      for (const imgId of payload.reviewImageIds) {
        await this.cleanupQueue.add(
          'delete-image',
          { publicId: imgId },
          {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      }
    }
  }
}
