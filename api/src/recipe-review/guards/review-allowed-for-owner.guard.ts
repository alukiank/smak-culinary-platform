import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RecipeReviewService } from '../recipe-review.service';
import { UserRoleEnum } from '../../user/enums/user-role.enum';

@Injectable()
export class ReviewAllowedForOwnerGuard implements CanActivate {
  constructor(private readonly recipeReviewService: RecipeReviewService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const reviewId = request.params.id;

    if (!user || !reviewId) {
      return false;
    }

    const review = await this.recipeReviewService.findOne(reviewId);

    const isOwner = review.user.id === user.id;

    if (['PATCH', 'PUT'].includes(request.method) && !isOwner) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    if (request.method === 'DELETE' && !isOwner) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    return true;
  }
}
