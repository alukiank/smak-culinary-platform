import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Recipe } from '../../../recipe/entities/recipe.entity';

@Injectable()
export class RecipeImageListener {
  private readonly logger = new Logger(RecipeImageListener.name);

  constructor(
    @InjectQueue('cloudinary-cleanup') private readonly cleanupQueue: Queue,
  ) {}

  @OnEvent('recipe.updated')
  async handleRecipeUpdated(payload: {
    recipe: Recipe;
    isContentChanged: boolean;
    oldCoverImageId?: string | null;
    oldGalleryImageIds?: string[];
  }) {
    const { recipe, oldCoverImageId, oldGalleryImageIds } = payload;

    if (
      recipe.coverImageId !== undefined &&
      oldCoverImageId &&
      oldCoverImageId !== recipe.coverImageId
    ) {
      this.logger.log(
        `Queueing old cover image for deletion: ${oldCoverImageId}`,
      );
      await this.cleanupQueue.add(
        'delete-image',
        { publicId: oldCoverImageId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }

    if (recipe.galleryImageIds !== undefined && oldGalleryImageIds) {
      const newGalleryIds = recipe.galleryImageIds || [];
      const imagesToDelete = oldGalleryImageIds.filter(
        (id) => !newGalleryIds.includes(id),
      );

      for (const imgId of imagesToDelete) {
        this.logger.log(
          `Queueing removed gallery image for deletion: ${imgId}`,
        );
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

  @OnEvent('recipe.deleted')
  async handleRecipeDeleted(payload: {
    recipe: Recipe;
    reviewImageIds?: string[];
  }) {
    const { recipe, reviewImageIds } = payload;
    this.logger.log(`Cleaning up images for deleted recipe: ${recipe.id}`);

    if (recipe.coverImageId) {
      await this.cleanupQueue.add(
        'delete-image',
        { publicId: recipe.coverImageId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }

    if (recipe.galleryImageIds?.length) {
      for (const imgId of recipe.galleryImageIds) {
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

    if (reviewImageIds?.length) {
      this.logger.log(
        `Queueing ${reviewImageIds.length} cascaded review images for deletion.`,
      );
      for (const imgId of reviewImageIds) {
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
