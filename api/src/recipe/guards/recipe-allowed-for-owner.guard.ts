import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { RecipeService } from '../../recipe/recipe.service';

@Injectable()
export class RecipeAllowedForOwnerGuard implements CanActivate {
  constructor(private readonly recipeService: RecipeService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const recipeId = request.params.id;

    if (!user) return false;

    const recipe = await this.recipeService.findOne(recipeId);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.user.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this recipe');
    }

    return true;
  }
}
