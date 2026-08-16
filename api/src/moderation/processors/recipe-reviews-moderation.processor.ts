import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bullmq';
import { GoogleAiService } from '../../infrastructure/google-ai/services/google-ai.service';
import { Content, Part } from '@google/genai';
import zodToJsonSchema from 'zod-to-json-schema';
import {
  ModerationResponseSchema,
  ModerationResponse,
} from '../../moderation/schemas/moderation-response.schema';
import { RecipeReviewService } from '../../recipe-review/recipe-review.service';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { ModerationType } from '../../shared/prompt-builder/enums/moderation-type.enum';
import { PromptBuilder } from '../../shared/prompt-builder/prompt-builder';
import { ModerationDecision } from '../../moderation/enums/moderation-decision.enum';
import { RecipeReviewModerationService } from '../services/recipe-review-moderation.service';

@Processor('recipe-review-premoderation', { concurrency: 10 })
export class RecipeReviewModerationProcessor extends WorkerHost {
  private readonly logger = new Logger(RecipeReviewModerationProcessor.name);

  constructor(
    private readonly geminiService: GoogleAiService,
    private readonly reviewService: RecipeReviewService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly moderationLogService: RecipeReviewModerationService,
  ) {
    super();
  }

  async process(job: Job<{ reviewId: string }>): Promise<void> {
    const { reviewId } = job.data;
    this.logger.log(
      `[Job:${job.id}] [Moderation] Processing review ID: ${reviewId}`,
    );

    try {
      const review = await this.reviewService.findOne(reviewId);
      if (!review) {
        this.logger.warn(
          `[Job:${job.id}] [Moderation] Review ${reviewId} not found`,
        );
        return;
      }

      if (!review.text && !review.imageId) {
        this.logger.log(
          `[Job:${job.id}] [Moderation] Review ${review.id} has no text/image. Auto-approving.`,
        );
        await this.reviewService.updatePublishStatus(review.id, true);
        return;
      }

      const systemInstruction = PromptBuilder.buildModeratorPrompt(
        ModerationType.REVIEW,
      );

      const reviewText = `
            Rating: ${review.rating} / 5
            Text: ${review.text || 'None'}
            `;

      const parts: Part[] = [{ text: reviewText }];

      if (review.imageId) {
        const imageData = await this.cloudinaryService.fetchImageAsBase64(
          review.imageId,
        );
        if (imageData) {
          parts.push({
            inlineData: {
              data: imageData.data,
              mimeType: imageData.mimeType,
            },
          });
        }
      }

      const contents: Content[] = [{ role: 'user', parts: parts }];

      const ModerationResponseJson: any = zodToJsonSchema(
        ModerationResponseSchema,
      );
      if (ModerationResponseJson.$schema) {
        delete ModerationResponseJson.$schema;
      }

      this.logger.log(
        `[Job:${job.id}] [Moderation] Sending review ${review.id} to Gemini API`,
      );

      const response = await this.geminiService.sendGenerateContentRequest(
        contents,
        [],
        systemInstruction,
        ModerationResponseJson,
      );

      const rawJson = JSON.parse(response.text);
      const aiResult: ModerationResponse =
        ModerationResponseSchema.parse(rawJson);

      this.logger.log(
        `[Job:${job.id}] [Moderation] Gemini decision for review: ${aiResult.decision} (Confidence: ${aiResult.confidenceScore})`,
      );

      let isPublished = false;

      if (aiResult.decision === 'APPROVED' && aiResult.confidenceScore > 0.8) {
        isPublished = true;
      }

      await this.reviewService.updatePublishStatus(review.id, isPublished);

      await this.moderationLogService.createLog(
        review.id,
        aiResult.decision.toLowerCase() as ModerationDecision,
        aiResult.reason,
        aiResult.confidenceScore,
      );

      this.logger.log(
        `[Job:${job.id}] [Moderation] Successfully processed review ${review.id}. Published: ${isPublished}`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `[Job:${job.id}] [Moderation] Review ${reviewId} was deleted before moderation. Skipping.`,
        );
        return;
      }
      this.logger.error(
        `[Job:${job.id}] [Moderation] Failed to process review ${reviewId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
