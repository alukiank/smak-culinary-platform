import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RecipeReviewCommentService } from '../recipe-review-comment.service';
import { CreateRecipeReviewCommentDto } from '../dto/create-recipe-review-comment.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { plainToInstance } from 'class-transformer';
import { RecipeReviewCommentResponseDto } from '../dto/recipe-review-comment-response.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { CommentAllowedForOwnerGuard } from '../guards/comment-allowed-for-owner.guard';
import { EmailVerificationGuard } from '../../auth/guards/email-verification.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Recipe Review Comments')
@Controller()
export class RecipeReviewCommentController {
  constructor(
    private readonly recipeReviewCommentService: RecipeReviewCommentService,
  ) {}

  @ApiOperation({
    summary: 'Отримання коментарів до відгуку',
    description:
      'Повертає посторінковий список коментарів до конкретного відгуку. ' +
      'Коментарі сортуються від найстаріших до найновіших (ASC). ' +
      'Доступно для всіх — авторизація не потрібна.',
  })
  @ApiParam({ name: 'reviewId', description: 'UUID відгуку.', type: String })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер сторінки (за замовчуванням 1).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Кількість коментарів на сторінку (за замовчуванням 10).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of comments with pagination metadata.',
    schema: {
      example: {
        data: [
          {
            id: 'comment-uuid',
            text: 'Thank you for the advice!',
            createdAt: '2026-01-01T10:00:00.000Z',
            updatedAt: '2026-01-01T10:00:00.000Z',
            user: { id: 'user-uuid', username: 'john', displayname: 'John' },
          },
        ],
        meta: {
          totalItems: 5,
          itemCount: 5,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid review UUID format.' })
  @Get('reviews/:reviewId/comments')
  async getCommentsByReview(
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<RecipeReviewCommentResponseDto>> {
    const paginatedResult = await this.recipeReviewCommentService.findByReview(
      reviewId,
      paginationDto,
    );
    const mappedData = plainToInstance(
      RecipeReviewCommentResponseDto,
      paginatedResult.data,
      { excludeExtraneousValues: true },
    );
    return new PaginatedResponseDto(mappedData, paginatedResult.meta);
  }

  @ApiOperation({
    summary: 'Додавання коментаря до відгуку',
    description:
      'Створює новий коментар до відгуку від імені поточного авторизованого користувача. ' +
      "Текст коментаря є обов'язковим і не може бути порожнім. " +
      'Після збереження автоматично оновлюється лічильник commentsCount у відгуку. ' +
      'Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'reviewId', description: 'UUID відгуку.', type: String })
  @ApiBody({ type: CreateRecipeReviewCommentDto })
  @ApiResponse({
    status: 201,
    description: 'Коментар успішно створено.',
    schema: {
      example: {
        id: 'comment-uuid',
        text: 'Чудова рецептура!',
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
        user: { id: 'user-uuid', username: 'john', displayname: 'John' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — comment text is missing or empty.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Email not confirmed.' })
  @UseGuards(AuthGuard('jwt-access'), EmailVerificationGuard)
  @Post('reviews/:reviewId/comments')
  async addComment(
    @CurrentUser('id') userId: string,
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @Body() dto: CreateRecipeReviewCommentDto,
  ): Promise<RecipeReviewCommentResponseDto> {
    const comment = await this.recipeReviewCommentService.create(
      userId,
      reviewId,
      dto,
    );
    return plainToInstance(RecipeReviewCommentResponseDto, comment, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Видалення коментаря',
    description:
      'Видаляє коментар до відгуку. Доступно лише для автора коментаря. ' +
      'Після видалення автоматично оновлюється лічильник commentsCount у відгуку. ' +
      'Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID коментаря.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe review comment successfully deleted — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Email not confirmed or recipe review comment does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe review comment not found.' })
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    CommentAllowedForOwnerGuard,
  )
  @Delete('comments/:id')
  async removeComment(
    @Param('id', new ParseUUIDPipe()) commentId: string,
  ): Promise<boolean> {
    return this.recipeReviewCommentService.remove(commentId);
  }
}
