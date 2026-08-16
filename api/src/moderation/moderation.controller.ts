import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  Get,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ModerateRecipeDto } from './dto/moderate-recipe.dto';
import { ModerateRecipeReviewDto } from './dto/moderate-recipe-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RolesAllowed } from '../auth/decorators/roles-allowed.decorator';
import { UserRoleEnum } from '../user/enums/user-role.enum';
import { RecipeModerationService } from './services/recipe-moderation.service';
import { RecipeReviewModerationService } from './services/recipe-review-moderation.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Admin/Moderation')
@ApiCookieAuth('jwt-access')
@UseGuards(AuthGuard('jwt-access'), RolesGuard)
@RolesAllowed(UserRoleEnum.ADMIN)
@Controller('admin/moderation')
export class ModerationAdminController {
  constructor(
    private readonly RecipeModerationService: RecipeModerationService,
    private readonly RecipeReviewModerationService: RecipeReviewModerationService,
  ) {}

  @ApiOperation({
    summary: '[ADMIN] Модерація рецепту',
    description:
      'Дозволяє адміністратору прийняти рішення щодо рецепту, що перебуває у статусі MODERATION ' +
      '(на стадії ручної перевірки після проходження AI-модерації). ' +
      'Рішення: ' +
      'APPROVED — рецепт переходить у статус PUBLIC та стає доступним для всіх; ' +
      'REJECTED — рецепт переходить у статус REJECTED; ' +
      'FLAGGED — рецепт позначається для додаткового перегляду. ' +
      "При рішенні REJECTED поле reason є обов'язковим (причина відхилення). " +
      'Рецепт ПОВИНЕН мати статус MODERATION — інакше повертається 400. ' +
      'Рішення та адміністратор фіксуються у журналі модерації (RecipeModerationLog). ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID рецепту у статусі MODERATION.',
    type: String,
  })
  @ApiBody({ type: ModerateRecipeDto })
  @ApiResponse({
    status: 201,
    description: 'Рішення прийнято. Повертає запис у журналі модерації.',
    schema: {
      example: {
        id: 'log-uuid',
        decision: 'approved',
        reason: 'Approved by Admin',
        aiConfidenceScore: 1.0,
        createdAt: '2026-01-01T12:00:00.000Z',
        admin: { id: 'admin-uuid' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Рецепт не перебуває у статусі MODERATION або reason не вказано при рішенні REJECTED.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Post('recipe/:id')
  async moderateRecipe(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ModerateRecipeDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.RecipeModerationService.moderateByAdmin(id, adminId, dto);
  }

  @ApiOperation({
    summary: '[ADMIN] Отримання журналу модерації рецепту',
    description:
      'Повертає повний хронологічний журнал усіх рішень (від найновіших до найстаріших) щодо модерації конкретного рецепту. ' +
      'Кожен запис містить: рішення (approved/rejected/flagged), причину, ' +
      'оцінку впевненості AI (aiConfidenceScore 0-1), дату та дані адміністратора, що прийняв рішення. ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Журнал модерації рецепту.',
    schema: {
      example: [
        {
          id: 'log-uuid-1',
          decision: 'approved',
          reason: 'Approved by Admin',
          aiConfidenceScore: 1.0,
          createdAt: '2026-01-02T10:00:00.000Z',
          admin: {
            id: 'admin-uuid',
            username: 'admin',
            email: 'admin@example.com',
          },
        },
        {
          id: 'log-uuid-2',
          decision: 'flagged',
          reason: 'Підозрілий контент, потребує перевірки',
          aiConfidenceScore: 0.72,
          createdAt: '2026-01-01T09:00:00.000Z',
          admin: null,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @Get('recipe/:id/logs')
  async getRecipeLogs(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.RecipeModerationService.getLogs(id);
  }

  @ApiOperation({
    summary: '[ADMIN] Модерація відгуку на рецепт',
    description:
      'Дозволяє адміністратору прийняти рішення щодо відгуку на рецепт. ' +
      'Рішення: ' +
      'APPROVED — відгук публікується (isPublished = true) та стає видимим для всіх; ' +
      'REJECTED — відгук залишається неопублікованим (isPublished = false); ' +
      'FLAGGED — відгук позначається для додаткового перегляду (isPublished = false). ' +
      "Поле reason є необов'язковим для відгуків. " +
      'Рішення та адміністратор фіксуються у журналі модерації (RecipeReviewModerationLog). ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID відгуку.', type: String })
  @ApiBody({ type: ModerateRecipeReviewDto })
  @ApiResponse({
    status: 201,
    description:
      'Рішення прийнято. Повертає запис у журналі модерації відгуку.',
    schema: {
      example: {
        id: 'log-uuid',
        decision: 'approved',
        reason: 'Approved by Admin',
        aiConfidenceScore: 1.0,
        createdAt: '2026-01-01T12:00:00.000Z',
        admin: { id: 'admin-uuid' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  @Post('recipe/review/:id')
  async moderateRecipeReview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ModerateRecipeReviewDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.RecipeReviewModerationService.moderateByAdmin(id, adminId, dto);
  }

  @ApiOperation({
    summary: '[ADMIN] Отримання журналу модерації відгуку',
    description:
      'Повертає повний хронологічний журнал усіх рішень (від найновіших до найстаріших) щодо модерації конкретного відгуку. ' +
      'Кожен запис містить: рішення (approved/rejected/flagged), причину, ' +
      'оцінку впевненості AI та дані адміністратора. ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID відгуку.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Журнал модерації відгуку.',
    schema: {
      example: [
        {
          id: 'log-uuid',
          decision: 'rejected',
          reason: 'Вміщує образливий контент',
          aiConfidenceScore: 0.95,
          createdAt: '2026-01-01T15:00:00.000Z',
          admin: { id: 'admin-uuid', username: 'admin' },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @Get('recipe/review/:id/logs')
  async getRecipeReviewLogs(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.RecipeReviewModerationService.getLogs(id);
  }
}
