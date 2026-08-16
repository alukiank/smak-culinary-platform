import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RecipeReviewCommentService } from '../recipe-review-comment.service';
import { UserRoleEnum } from '../../user/enums/user-role.enum';

@Injectable()
export class CommentAllowedForOwnerGuard implements CanActivate {
  constructor(private readonly commentService: RecipeReviewCommentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const commentId = request.params.id;

    if (!user || !commentId) {
      return false;
    }

    const comment = await this.commentService.findOne(commentId);

    const isOwner = comment.user.id === user.id;

    if (!isOwner) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return true;
  }
}
