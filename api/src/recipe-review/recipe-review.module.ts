import { Module } from '@nestjs/common';
import { RecipeReviewService } from './recipe-review.service';
import { RecipeReviewController } from './controllers/recipe-review.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeReview } from './entities/recipe-review.entity';
import { RecipeReviewAdminController } from './controllers/recipe-review.admin.controller';
import { RecipeReviewListener } from './listeners/recipe-review.listener';

@Module({
  imports: [TypeOrmModule.forFeature([RecipeReview])],
  controllers: [RecipeReviewController, RecipeReviewAdminController],
  providers: [RecipeReviewService, RecipeReviewListener],
  exports: [RecipeReviewService],
})
export class RecipeReviewModule {}
