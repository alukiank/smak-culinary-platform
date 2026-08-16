import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './controllers/recipe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeVector } from './entities/recipe-vector.entity';
import { RecipeEmbeddingProcessor } from './processors/recipe-embedding.process';
import { RecipeAdminController } from './controllers/recipe.admin.controller';
import { RecipeRatingListener } from './listeners/recipe-rating.listener';
import { RecipeReviewModule } from '../recipe-review/recipe-review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, RecipeVector]),
    RecipeReviewModule,
  ],
  controllers: [RecipeController, RecipeAdminController],
  providers: [RecipeService, RecipeEmbeddingProcessor, RecipeRatingListener],
  exports: [RecipeService],
})
export class RecipeModule {}
