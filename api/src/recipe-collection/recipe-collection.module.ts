import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeCollection } from './entities/recipe-collection.entity';
import { RecipeCollectionService } from './recipe-collection.service';
import { RecipeCollectionController } from './recipe-collection.controller';
import { Recipe } from '../recipe/entities/recipe.entity';
import { BillingModule } from '../billing/billing.module';
import { UserRegisteredListener } from './listeners/user-registered.listener';
import { CollectionLimitGuard } from './guards/collection-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecipeCollection, Recipe]),
    BillingModule,
  ],
  controllers: [RecipeCollectionController],
  providers: [
    RecipeCollectionService,
    UserRegisteredListener,
    CollectionLimitGuard,
  ],
  exports: [RecipeCollectionService],
})
export class RecipeCollectionModule {}
