import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RecipeReviewService } from '../recipe-review.service';
import { CreateRecipeReviewDto } from '../dto/create-recipe-review.dto';
import { UpdateRecipeReviewDto } from '../dto/update-recipe-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { plainToInstance } from 'class-transformer';
import { RecipeReviewResponseDto } from '../dto/recipe-review-response.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ReviewAllowedForOwnerGuard } from '../guards/review-allowed-for-owner.guard';
import { EmailVerificationGuard } from '../../auth/guards/email-verification.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Recipe Reviews')
@Controller()
export class RecipeReviewController {
  constructor(private readonly recipeReviewService: RecipeReviewService) {}

  @ApiOperation({
    summary: 'Отримання списку відгуків для рецепту',
    description:
      'Повертає посторінковий список опублікованих відгуків (isPublished = true) для конкретного рецепту. ' +
      'Відгуки сортуються від найновіших до найстаріших. ' +
      'Неопубліковані відгуки (що проходять або не пройшли модерацію) не відображаються.',
  })
  @ApiParam({ name: 'recipeId', description: 'UUID рецепту.', type: String })
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
    description: 'Кількість відгуків на сторінку (за замовчуванням 10).',
  })
  @ApiResponse({
    status: 200,
    description: 'Список опублікованих відгуків з метаданими пагінації.',
    schema: {
      example: {
        data: [
          {
            id: 'review-uuid',
            rating: 4.5,
            text: 'Чудовий рецепт!',
            imageId: null,
            commentsCount: 2,
            isPublished: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            user: {
              id: 'user-uuid',
              username: 'john_doe',
              displayname: 'John Doe',
            },
          },
        ],
        meta: {
          totalItems: 25,
          itemCount: 10,
          itemsPerPage: 10,
          totalPages: 3,
          currentPage: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid recipe UUID format.' })
  @Get('recipes/:recipeId/reviews')
  async findAllByRecipe(
    @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<RecipeReviewResponseDto>> {
    const paginatedResult = await this.recipeReviewService.findAllByRecipe(
      recipeId,
      paginationDto,
    );
    const mappedData = plainToInstance(
      RecipeReviewResponseDto,
      paginatedResult.data,
      { excludeExtraneousValues: true },
    );
    return new PaginatedResponseDto(mappedData, paginatedResult.meta);
  }

  @ApiOperation({
    summary: 'Отримання відгуку за ID',
    description:
      'Повертає дані конкретного відгуку. Повертає лише опублікований відгук (isPublished = true). ' +
      'Включає дані автора відгуку та рецепту.',
  })
  @ApiParam({ name: 'id', description: 'UUID відгуку.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe data.',
    type: RecipeReviewResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recipe review not found or not published.',
  })
  @Get('reviews/:id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<RecipeReviewResponseDto> {
    const review = await this.recipeReviewService.findOne(id, true);
    return plainToInstance(RecipeReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Додавання відгуку до рецепту',
    description:
      'Створює новий відгук для рецепту від поточного авторизованого користувача. ' +
      "Рейтинг є обов'язковим (від 0 до 5). Текст та зображення — необов'язкові. " +
      'Один користувач може залишити лише один відгук на один рецепт (унікальне обмеження). ' +
      'Після збереження автоматично перераховується середній рейтинг рецепту. ' +
      'Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'recipeId', description: 'UUID рецепту.', type: String })
  @ApiBody({ type: CreateRecipeReviewDto })
  @ApiResponse({
    status: 201,
    description: 'Recipe review created successfully.',
    type: RecipeReviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error or user has already left a review for this recipe.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Email not confirmed.' })
  @UseGuards(AuthGuard('jwt-access'), EmailVerificationGuard)
  @Post('recipes/:recipeId/reviews')
  async create(
    @CurrentUser('id') userId: string,
    @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    @Body() dto: CreateRecipeReviewDto,
  ): Promise<RecipeReviewResponseDto> {
    const review = await this.recipeReviewService.create(userId, recipeId, dto);
    return plainToInstance(RecipeReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Оновлення відгуку',
    description:
      'Оновлює рейтинг, текст або зображення відгуку. Доступно лише для автора відгуку. ' +
      'Після оновлення автоматично перераховується середній рейтинг рецепту. ' +
      'Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID відгуку.', type: String })
  @ApiBody({ type: UpdateRecipeReviewDto })
  @ApiResponse({
    status: 200,
    description: 'Recipe review updated successfully.',
    type: RecipeReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Email not confirmed or recipe review does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe review not found.' })
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    ReviewAllowedForOwnerGuard,
  )
  @Patch('reviews/:id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecipeReviewDto,
  ): Promise<RecipeReviewResponseDto> {
    const updatedReview = await this.recipeReviewService.update(id, dto);
    return plainToInstance(RecipeReviewResponseDto, updatedReview, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Видалення відгуку',
    description:
      'Видаляє відгук разом із усіма коментарями до нього. Доступно лише для автора відгуку. ' +
      'Після видалення автоматично перераховується середній рейтинг рецепту. ' +
      'Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID відгуку.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe review deleted successfully — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Email not confirmed or recipe review does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe review not found.' })
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    ReviewAllowedForOwnerGuard,
  )
  @Delete('reviews/:id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<boolean> {
    return this.recipeReviewService.remove(id);
  }

  @ApiOperation({
    summary: 'Отримання списку відгуків для рецептів автора',
    description:
      'Повертає посторінковий список опублікованих відгуків (isPublished = true), ' +
      'які були залишені під усіма рецептами конкретного автора.',
  })
  @ApiParam({ name: 'userId', description: 'UUID автора рецептів.', type: String })
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
    description: 'Кількість відгуків на сторінку (за замовчуванням 10).',
  })
  @ApiResponse({
    status: 200,
    description: 'Список опублікованих відгуків під рецептами автора.',
  })
  @Get('users/:userId/reviews')
  async findAllByAuthor(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<RecipeReviewResponseDto>> {
    const paginatedResult = await this.recipeReviewService.findAllByAuthor(
      userId,
      paginationDto,
    );
    const mappedData = plainToInstance(
      RecipeReviewResponseDto,
      paginatedResult.data,
      { excludeExtraneousValues: true },
    );
    return new PaginatedResponseDto(mappedData, paginatedResult.meta);
  }
}
