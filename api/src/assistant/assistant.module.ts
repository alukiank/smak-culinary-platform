import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { ToolHandlerService } from './tools/tool-handler.service';
import { RecipeModule } from '../recipe/recipe.module';

@Module({
  imports: [RecipeModule],
  providers: [AssistantService, ToolHandlerService],
  exports: [AssistantService],
})
export class AssistantModule {}
