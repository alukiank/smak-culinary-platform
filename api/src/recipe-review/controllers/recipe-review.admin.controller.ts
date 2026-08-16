import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { RecipeReviewService } from '../recipe-review.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RolesAllowed } from '../../auth/decorators/roles-allowed.decorator';
import { UserRoleEnum } from '../../user/enums/user-role.enum';
import { plainToInstance } from 'class-transformer';
import { RecipeReviewResponseDto } from '../dto/recipe-review-response.dto';
import { ReviewSearchAdminDto } from '../dto/review-search-admin.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Admin/Recipe Reviews')
@ApiCookieAuth('jwt-access')
@UseGuards(AuthGuard('jwt-access'), RolesGuard)
@RolesAllowed(UserRoleEnum.ADMIN)
@Controller('admin')
export class RecipeReviewAdminController {
  constructor(private readonly recipeReviewService: RecipeReviewService) {}

  @ApiOperation({
    summary: '[ADMIN] Отримання всіх відгуків',
    description:
      'Повертає посторінковий список усіх відгуків у системі незалежно від статусу публікації. ' +
      'Адміністратор може фільтрувати відгуки за полем isPublished: ' +
      'true — лише опубліковані, false — лише неопубліковані (очікують модерацію або відхилені), ' +
      'не передавати — усі відгуки. ' +
      'Відгуки сортуються від найновіших до найстаріших. ' +
      'Включає дані про автора та рецепт. Доступно лише для адміністраторів.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        isPublished: {
          type: 'boolean',
          example: false,
          description: "Фільтр за статусом публікації (необов'язково).",
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Список відгуків з метаданими пагінації.',
    schema: {
      example: {
        data: [
          {
            id: 'review-uuid',
            rating: 3,
            text: 'Непоганий рецепт',
            isPublished: false,
            commentsCount: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            user: { id: 'user-uuid', username: 'jane', displayname: 'Jane' },
            recipe: { id: 'recipe-uuid', title: 'Паста' },
          },
        ],
        meta: {
          totalItems: 100,
          itemCount: 10,
          itemsPerPage: 10,
          totalPages: 10,
          currentPage: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @Get('reviews')
  async findAll(
    @Query() queryDto: ReviewSearchAdminDto,
  ): Promise<PaginatedResponseDto<RecipeReviewResponseDto>> {
    const paginatedResult = await this.recipeReviewService.findAll(
      queryDto,
      queryDto.isPublished,
    );
    const mappedData = plainToInstance(
      RecipeReviewResponseDto,
      paginatedResult.data,
      { excludeExtraneousValues: true },
    );
    return new PaginatedResponseDto(mappedData, paginatedResult.meta);
  }

  @ApiOperation({
    summary:
      '[ADMIN] Отримання відгуку за ID (незалежно від статусу публікації)',
    description:
      'Повертає дані конкретного відгуку за UUID незалежно від того, чи є він опублікованим. ' +
      'Включає дані про автора та рецепт. Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID відгуку.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe data.',
    type: RecipeReviewResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe review not found.' })
  @Get('reviews/:id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('isPublished') isPublished?: boolean,
  ): Promise<RecipeReviewResponseDto> {
    const review = await this.recipeReviewService.findOne(id, isPublished);
    return plainToInstance(RecipeReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: '[ADMIN] Зміна статусу публікації відгуку',
    description:
      'Публікує або приховує відгук. Зазвичай використовується після ручного перегляду відгуку адміністратором. ' +
      'isPublished = true — відгук стає видимим для всіх користувачів. ' +
      'isPublished = false — відгук прихований (неопублікований). ' +
      'Для зміни статусу через повну систему модерації з веденням логів використовуйте ' +
      'POST /admin/moderation/recipe/review/:id.',
  })
  @ApiParam({ name: 'id', description: 'UUID відгуку.', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isPublished: {
          type: 'boolean',
          example: true,
          description: 'true — опублікувати, false — приховати.',
        },
      },
      required: ['isPublished'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Publication status successfully updated — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe review not found.' })
  @Patch('reviews/:id/publish')
  async updatePublishStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('isPublished') isPublished: boolean,
  ): Promise<boolean> {
    return this.recipeReviewService.updatePublishStatus(id, isPublished);
  }

  @ApiOperation({
    summary: '[ADMIN] Видалення відгуку',
    description:
      'Примусово видаляє будь-який відгук із системи незалежно від його статусу та власника. ' +
      'Операція незворотна. При видаленні також автоматично перераховується середній рейтинг рецепту. ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID відгуку.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe review successfully deleted — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe review not found.' })
  @Delete('reviews/:id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<boolean> {
    return this.recipeReviewService.remove(id);
  }
}
