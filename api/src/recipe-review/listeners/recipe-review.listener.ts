import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeReview } from '../entities/recipe-review.entity';

@Injectable()
export class RecipeReviewListener {
  constructor(
    @InjectRepository(RecipeReview)
    private readonly reviewRepository: Repository<RecipeReview>,
  ) {}

  @OnEvent('review-comment.created')
  async handleCommentCreated(reviewId: string) {
    await this.reviewRepository.increment({ id: reviewId }, 'commentsCount', 1);
  }

  @OnEvent('review-comment.deleted')
  async handleCommentDeleted(reviewId: string) {
    await this.reviewRepository.decrement({ id: reviewId }, 'commentsCount', 1);
  }
}
