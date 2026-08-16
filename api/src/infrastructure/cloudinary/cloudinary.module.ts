import { Module, Global } from '@nestjs/common';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';
import { RecipeImageListener } from './listeners/recipe-image.listener';
import { CloudinaryCleanupProcessor } from './processors/cloudinary-cleanup.processor';
import { RecipeReviewImageListener } from './listeners/recipe-review-image.listener';

@Global()
@Module({
  controllers: [CloudinaryController],
  providers: [
    CloudinaryService,
    RecipeImageListener,
    RecipeReviewImageListener,
    CloudinaryCleanupProcessor,
  ],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
