import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeModerationLog } from './entities/recipe-moderation-log.entity';
import { RecipeModerationProcessor } from './processors/recipe-moderation.processor';
import { RecipeModule } from '../recipe/recipe.module';
import { RecipeModerationListener } from './listeners/recipe-moderation.listener';
import { RecipeReviewModerationLog } from './entities/recipe-review-moderation-log.entity';
import { RecipeReviewModule } from '../recipe-review/recipe-review.module';
import { RecipeReviewModerationService } from './services/recipe-review-moderation.service';
import { RecipeModerationService } from './services/recipe-moderation.service';
import { RecipeReviewModerationListener } from './listeners/recipe-reviews-moderation.listener';
import { RecipeReviewModerationProcessor } from './processors/recipe-reviews-moderation.processor';
import { RecipeReviewCommentModule } from '../recipe-review-comment/recipe-review-comment.module';
import { ModerationAdminController } from './moderation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecipeModerationLog, RecipeReviewModerationLog]),
    RecipeModule,
    RecipeReviewModule,
    RecipeReviewCommentModule,
  ],
  providers: [
    RecipeModerationService,
    RecipeReviewModerationService,
    RecipeModerationProcessor,
    RecipeModerationListener,
    RecipeReviewModerationListener,
    RecipeReviewModerationProcessor,
  ],
  exports: [RecipeModerationService, RecipeReviewModerationService],
  controllers: [ModerationAdminController],
})
export class ModerationModule {}
