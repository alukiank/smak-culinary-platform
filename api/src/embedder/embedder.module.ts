import { Module, Global } from '@nestjs/common';
import { EmbedderService } from './embedder.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeVector } from '../recipe/entities/recipe-vector.entity';
import { IndexingRecipesListenerService } from './listeners/indexing-recipes.listener';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RecipeVector])],
  controllers: [],
  providers: [EmbedderService, IndexingRecipesListenerService],
  exports: [EmbedderService],
})
export class EmbedderModule {}
