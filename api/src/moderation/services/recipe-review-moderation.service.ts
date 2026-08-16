import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeReviewModerationLog } from '../entities/recipe-review-moderation-log.entity';
import { User } from '../../user/entities/user.entity';
import { ModerationDecision } from '../enums/moderation-decision.enum';
import { ModerateRecipeReviewDto } from '../dto/moderate-recipe-review.dto';
import { RecipeReviewService } from '../../recipe-review/recipe-review.service';

@Injectable()
export class RecipeReviewModerationService {
  constructor(
    @InjectRepository(RecipeReviewModerationLog)
    private readonly reviewLogRepo: Repository<RecipeReviewModerationLog>,
    readonly recipeReviewService: RecipeReviewService,
  ) {}

  async createLog(
    reviewId: string,
    decision: ModerationDecision,
    reason?: string,
    aiConfidence?: number,
    admin?: User,
  ): Promise<RecipeReviewModerationLog> {
    const log = this.reviewLogRepo.create({
      review: { id: reviewId },
      decision,
      reason,
      aiConfidenceScore: aiConfidence,
      admin,
    });
    return await this.reviewLogRepo.save(log);
  }

  async getLogs(reviewId: string): Promise<RecipeReviewModerationLog[]> {
    return await this.reviewLogRepo.find({
      where: { review: { id: reviewId } },
      order: { createdAt: 'DESC' },
      relations: ['admin'],
    });
  }

  async moderateByAdmin(
    reviewId: string,
    adminId: string,
    dto: ModerateRecipeReviewDto,
  ): Promise<RecipeReviewModerationLog> {
    const review = await this.recipeReviewService.findOne(reviewId);
    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    const isPublished = dto.decision === ModerationDecision.APPROVED;

    await this.recipeReviewService.updatePublishStatus(review.id, isPublished);

    return await this.createLog(
      review.id,
      dto.decision,
      dto.reason || (isPublished ? 'Approved by Admin' : 'Rejected by Admin'),
      1.0,
      { id: adminId } as User,
    );
  }
}
