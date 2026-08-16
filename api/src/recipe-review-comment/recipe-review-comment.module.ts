import { Module } from '@nestjs/common';
import { RecipeReviewCommentService } from './recipe-review-comment.service';
import { RecipeReviewCommentController } from './controllers/recipe-review-comment.controller';
import { RecipeReviewComment } from './entities/recipe-review-comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeReviewCommentAdminController } from './controllers/recipe-review-comment.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecipeReviewComment])],
  controllers: [
    RecipeReviewCommentController,
    RecipeReviewCommentAdminController,
  ],
  providers: [RecipeReviewCommentService],
  exports: [RecipeReviewCommentService],
})
export class RecipeReviewCommentModule {}
