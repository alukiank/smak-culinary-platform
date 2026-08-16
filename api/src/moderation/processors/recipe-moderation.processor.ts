import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bullmq';
import { GoogleAiService } from '../../infrastructure/google-ai/services/google-ai.service';
import { Content, Part } from '@google/genai';
import zodToJsonSchema from 'zod-to-json-schema';
import {
  ModerationResponseSchema,
  ModerationResponse,
} from '../schemas/moderation-response.schema';
import { RecipeService } from '../../recipe/recipe.service';
import { RecipeStatusEnum } from '../../recipe/enums/recipe-status.enum';
import { ModerationDecision } from '../enums/moderation-decision.enum';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { ModerationType } from '../../shared/prompt-builder/enums/moderation-type.enum';
import { PromptBuilder } from '../../shared/prompt-builder/prompt-builder';
import { RecipeModerationService } from '../services/recipe-moderation.service';

@Processor('recipe-premoderation', { concurrency: 10 })
export class RecipeModerationProcessor extends WorkerHost {
  private readonly logger = new Logger(RecipeModerationProcessor.name);

  constructor(
    private readonly geminiService: GoogleAiService,
    private readonly recipeService: RecipeService,
    private readonly moderationLogService: RecipeModerationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super();
  }

  async process(job: Job<{ recipeId: string }>): Promise<void> {
    const { recipeId } = job.data;
    this.logger.log(
      `[Job:${job.id}] [Moderation] Processing recipe ID: ${recipeId}`,
    );

    try {
      const recipe = await this.recipeService.findOne(recipeId);
      if (!recipe) {
        this.logger.warn(
          `[Job:${job.id}] [Moderation] Recipe ${recipeId} not found`,
        );
        return;
      }

      const systemInstruction = PromptBuilder.buildModeratorPrompt(
        ModerationType.RECIPE,
      );

      const recipeText = `
            Title: ${recipe.title}
            Category: ${recipe.category || 'None'}}
            Description: ${recipe.description || 'None'}
          
            Ingredients: 
            ${recipe.ingredients?.length ? recipe.ingredients.join('\n') : 'None'}
          
            Directions: 
            ${recipe.directions?.length ? recipe.directions.join('\n') : 'None'}
          
            YouTube URL: ${recipe.youtubeVideoUrl || 'None'}
            `;

      const parts: Part[] = [{ text: recipeText }];

      const imageIds: string[] = [];
      if (recipe.coverImageId) imageIds.push(recipe.coverImageId);
      if (recipe.galleryImageIds?.length)
        imageIds.push(...recipe.galleryImageIds);

      for (const imgId of imageIds.slice(0, 10)) {
        const imageData =
          await this.cloudinaryService.fetchImageAsBase64(imgId);

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
        `[Job:${job.id}] [Moderation] Sending recipe ${recipe.id} to Gemini with ${parts.length - 1} images`,
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
        `[Job:${job.id}] [Moderation] Gemini decision: ${aiResult.decision} (Confidence: ${aiResult.confidenceScore})`,
      );

      let newStatus: RecipeStatusEnum;

      if (aiResult.decision === 'APPROVED' && aiResult.confidenceScore > 0.8) {
        newStatus = RecipeStatusEnum.PUBLIC;
      } else if (aiResult.decision === 'REJECTED') {
        newStatus = RecipeStatusEnum.REJECTED;
      } else {
        newStatus = RecipeStatusEnum.MODERATION;
      }

      await this.recipeService.updateStatus(recipe.id, newStatus);

      await this.moderationLogService.createLog(
        recipe,
        aiResult.decision.toLowerCase() as ModerationDecision,
        aiResult.reason,
        aiResult.confidenceScore,
      );

      this.logger.log(
        `[Job:${job.id}] [Moderation] Successfully processed recipe ${recipe.id}. New status: ${newStatus}`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `[Job:${job.id}] [Moderation] Recipe ${recipeId} was deleted before moderation. Skipping.`,
        );
        return;
      }
      this.logger.error(
        `[Job:${job.id}] [Moderation] Failed to process recipe ${recipeId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
