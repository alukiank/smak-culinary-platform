import {
  Controller,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RecipeReviewCommentService } from '../recipe-review-comment.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RolesAllowed } from '../../auth/decorators/roles-allowed.decorator';
import { UserRoleEnum } from '../../user/enums/user-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Admin/Recipe Review Comments')
@ApiCookieAuth('jwt-access')
@UseGuards(AuthGuard('jwt-access'), RolesGuard)
@RolesAllowed(UserRoleEnum.ADMIN)
@Controller('admin')
export class RecipeReviewCommentAdminController {
  constructor(
    private readonly recipeReviewCommentService: RecipeReviewCommentService,
  ) {}

  @ApiOperation({
    summary: '[ADMIN] Видалення коментаря до відгуку',
    description:
      'Примусово видаляє будь-який коментар із системи незалежно від його автора. ' +
      'Операція незворотна. Після видалення автоматично оновлюється лічильник commentsCount у відповідному відгуку. ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID коментаря.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe review comment successfully deleted — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe review comment not found.' })
  @Delete('comments/:id')
  async removeComment(
    @Param('id', new ParseUUIDPipe()) commentId: string,
  ): Promise<boolean> {
    return this.recipeReviewCommentService.remove(commentId);
  }
}
