import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Recipe } from '../entities/recipe.entity';
import { RecipeVector } from '../entities/recipe-vector.entity';
import { EmbedderService } from '../../embedder/embedder.service';

@Processor('recipe-indexing', { concurrency: 10 })
export class RecipeEmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(RecipeEmbeddingProcessor.name);

  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeVector)
    private readonly vectorRepository: Repository<RecipeVector>,
    private readonly embedderService: EmbedderService,
  ) {
    super();
  }

  async process(
    job: Job<{ recipeId: string; text: string; title: string }>,
  ): Promise<void> {
    const { recipeId, text, title } = job.data;

    try {
      this.logger.log(
        `[Job:${job.id}] Starting vector generation for recipe: "${title}" (ID: ${recipeId})`,
      );
      const embedding = await this.embedderService.embedDocument(text, title);

      let recipeVector = await this.vectorRepository.findOne({
        where: { recipe: { id: recipeId } },
      });

      if (recipeVector) {
        recipeVector.embedding = embedding;
      } else {
        recipeVector = this.vectorRepository.create({
          recipe: { id: recipeId } as Recipe,
          embedding,
        });
      }

      await this.vectorRepository.save(recipeVector);

      this.logger.log(
        `[Job:${job.id}] Vector for recipe "${title}" successfully saved.`,
      );
    } catch (error) {
      this.logger.error(
        `[Job:${job.id}] Failed to process recipe ${recipeId} ("${title}"): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
