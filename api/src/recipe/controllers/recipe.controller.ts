import {
  Controller,
  Body,
  Post,
  Get,
  Query,
  Header,
  Put,
  Param,
  UseGuards,
  Delete,
  NotFoundException,
  ForbiddenException,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RecipeService } from '../recipe.service';
import { CreateRecipeDto } from '../dto/recipe-create.dto';
import { RecipeSearchDto } from '../dto/recipe-search.dto';
import { AuthGuard } from '@nestjs/passport';
import { RecipeAllowedForOwnerGuard } from '../guards/recipe-allowed-for-owner.guard';
import { RecipeStatusEnum } from '../enums/recipe-status.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../user/entities/user.entity';
import { OptionalAuthGuard } from '../../auth/guards/optional-auth.guard';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { plainToInstance } from 'class-transformer';
import { RecipeResponseDto } from '../dto/recipe-response.dto';
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

@ApiTags('Recipes')
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @ApiOperation({
    summary: 'Створення нового рецепту',
    description:
      'Створює новий рецепт від імені поточного авторизованого користувача. ' +
      'Статус за замовчуванням — DRAFT. Якщо вказати status = "premoderation", ' +
      'рецепт буде відправлено на модерацію. ' +
      'Після збереження асинхронно генерується векторне вбудовування для семантичного пошуку. ' +
      'Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({
    status: 201,
    description: 'Рецепт успішно створено.',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error — required fields are missing or have incorrect format.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Email not confirmed.' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during recipe save.',
  })
  @Post()
  @UseGuards(AuthGuard('jwt-access'), EmailVerificationGuard)
  async create(
    @CurrentUser('id') userId: string,
    @Body() createRecipeDto: CreateRecipeDto,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.recipeService.create(createRecipeDto, userId);
    return plainToInstance(RecipeResponseDto, recipe, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Отримання схожих рецептів',
    description:
      'Знаходить семантично схожі рецепти на основі векторного вбудовування (pgvector cosine distance). ' +
      'Повертає до 5 найбільш схожих рецептів, окрім самого рецепту. ' +
      'Якщо вектор для рецепту ще не згенеровано — повертає порожній масив.',
  })
  @ApiQuery({
    name: 'id',
    description: 'UUID рецепту, для якого шукаються схожі.',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Array of similar recipes (up to 5).',
    type: [RecipeResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format.' })
  @Get('similar')
  async similar(
    @Query('id', new ParseUUIDPipe()) id: string,
    @Query('limit') limit?: number,
  ): Promise<RecipeResponseDto[]> {
    const recipes = await this.recipeService.getSimilarRecipes(id, limit);
    return plainToInstance(RecipeResponseDto, recipes, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Пошук та фільтрація рецептів',
    description:
      'Пошук рецептів із підтримкою семантичного пошуку (pgvector) за текстовим запитом та фільтрами. ' +
      'Неавторизовані користувачі та авторизовані, що переглядають чужі рецепти, ' +
      'бачать лише рецепти зі статусом PUBLIC. ' +
      'Авторизований користувач може переглядати власні рецепти з будь-яким статусом, ' +
      'передаючи свій userId у параметрі userId. ' +
      'Якщо вказано query — результати сортуються за семантичною близькістю, ' +
      'інакше — за датою створення (від нових до старих).',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Текстовий запит для семантичного пошуку.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Фільтр за категорією рецепту (наприклад, "Soups & Stews").',
  })
  @ApiQuery({
    name: 'cuisineList',
    required: false,
    description: 'Масив кухонь для фільтрації (наприклад, "italian,french").',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    description: 'Складність: easy | medium | hard.',
  })
  @ApiQuery({
    name: 'cookSpeed',
    required: false,
    description: 'Швидкість приготування: fast | medium | slow.',
  })
  @ApiQuery({
    name: 'maxCookTime',
    required: false,
    description: 'Максимальний час приготування (хвилини).',
    type: Number,
  })
  @ApiQuery({
    name: 'minHealthScore',
    required: false,
    description: "Мінімальний індекс здоров'я (0-100).",
    type: Number,
  })
  @ApiQuery({
    name: 'maxHealthScore',
    required: false,
    description: "Максимальний індекс здоров'я (0-100).",
    type: Number,
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Мінімальний рейтинг (0-5).',
    type: Number,
  })
  @ApiQuery({
    name: 'maxRating',
    required: false,
    description: 'Максимальний рейтинг (0-5).',
    type: Number,
  })
  @ApiQuery({ name: 'isVegan', required: false, type: Boolean })
  @ApiQuery({ name: 'isVegetarian', required: false, type: Boolean })
  @ApiQuery({ name: 'isGluten_free', required: false, type: Boolean })
  @ApiQuery({ name: 'isHalal', required: false, type: Boolean })
  @ApiQuery({ name: 'isKosher', required: false, type: Boolean })
  @ApiQuery({ name: 'isDairyFree', required: false, type: Boolean })
  @ApiQuery({ name: 'isNutFree', required: false, type: Boolean })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Фільтр за UUID автора рецептів.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Фільтр за статусом (лише для власних рецептів): public | draft | archived | rejected | premoderation | moderation.',
  })
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
    description: 'Кількість на сторінку (за замовчуванням 10).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of recipes with pagination metadata.',
    schema: {
      example: {
        data: [
          {
            id: 'recipe-uuid',
            title: 'Borscht',
            status: 'public',
            rating: 4.5,
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
  @Get()
  @UseGuards(OptionalAuthGuard)
  async search(
    @CurrentUser() user: User,
    @Query() searchDto: RecipeSearchDto,
  ): Promise<PaginatedResponseDto<RecipeResponseDto>> {
    if (!user || searchDto.userId !== user.id) {
      searchDto.status = RecipeStatusEnum.PUBLIC;
    }
    const paginatedResult =
      await this.recipeService.searchRecipesWithFilters(searchDto);

    return {
      ...paginatedResult,
      data: plainToInstance(RecipeResponseDto, paginatedResult.data, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @ApiOperation({
    summary: 'Отримання рецепту за ID',
    description:
      'Повертає повні дані рецепту за UUID. ' +
      'Публічні рецепти (status = PUBLIC) доступні для всіх без авторизації. ' +
      'Рецепти з іншими статусами (DRAFT, ARCHIVED, PREMODERATION, MODERATION, REJECTED) ' +
      'доступні лише для автора рецепту (вимагає авторизацію). ' +
      'Включає дані автора (UserPublicDto).',
  })
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe data.',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden — recipe is not public and does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.recipeService.findOne(id);
    if (!recipe) throw new NotFoundException();

    if (
      recipe.status === RecipeStatusEnum.PUBLIC ||
      (user && recipe.user.id === user.id)
    ) {
      return plainToInstance(RecipeResponseDto, recipe, {
        excludeExtraneousValues: true,
      });
    }

    throw new ForbiddenException();
  }

  @ApiOperation({
    summary: 'Повне оновлення рецепту',
    description:
      'Оновлює всі дані рецепту (PUT-семантика). Доступно лише для власника рецепту. ' +
      'ВАЖЛИВО: якщо змінюється контент рецепту (title, description, ingredients, directions, зображення) ' +
      'і рецепт має статус PUBLIC — він автоматично переходить у статус PREMODERATION для повторної перевірки. ' +
      'Статус при оновленні може бути лише DRAFT або PREMODERATION. ' +
      'Після оновлення асинхронно регенерується векторне вбудовування. ' +
      'Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully updated.',
    type: RecipeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Email not confirmed or recipe does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during update.',
  })
  @Put(':id')
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    RecipeAllowedForOwnerGuard,
  )
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateRecipeDto: CreateRecipeDto,
  ): Promise<RecipeResponseDto> {
    const updatedRecipe = await this.recipeService.update(id, updateRecipeDto);
    return plainToInstance(RecipeResponseDto, updatedRecipe, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Переведення рецепту у чернетку (DRAFT)',
    description:
      'Змінює статус рецепту на DRAFT. Рецепт стає невидимим для інших користувачів. ' +
      'Доступно лише для власника рецепту. Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Status changed to DRAFT — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Email not confirmed or recipe does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Patch(':id/draft')
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    RecipeAllowedForOwnerGuard,
  )
  async draft(@Param('id', new ParseUUIDPipe()) id: string): Promise<boolean> {
    return this.recipeService.updateStatus(id, RecipeStatusEnum.DRAFT);
  }

  @ApiOperation({
    summary: 'Архівування рецепту',
    description:
      'Змінює статус рецепту на ARCHIVED. Архівований рецепт прихований від пошуку, але не видалений. ' +
      'Доступно лише для власника рецепту. Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Status changed to ARCHIVED — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Email not confirmed or recipe does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Patch(':id/archive')
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    RecipeAllowedForOwnerGuard,
  )
  async archive(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<boolean> {
    return this.recipeService.updateStatus(id, RecipeStatusEnum.ARCHIVED);
  }

  @ApiOperation({
    summary: 'Розархівування рецепту (переведення у DRAFT)',
    description:
      'Знімає рецепт з архіву — переводить статус у DRAFT. ' +
      'Доступно лише для власника рецепту. Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Status changed to DRAFT (unarchived) — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Email not confirmed or recipe does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Patch(':id/unarchive')
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    RecipeAllowedForOwnerGuard,
  )
  async unarchive(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<boolean> {
    return this.recipeService.updateStatus(id, RecipeStatusEnum.DRAFT);
  }

  @ApiOperation({
    summary: 'Переведення рецепту в премодерацію',
    description:
      'Переводить рецепт зі статусом DRAFT у статус PREMODERATION для перевірки модератором. ' +
      'Доступно лише для власника рецепту. Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Status changed to PREMODERATION — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Email not confirmed or recipe is not in DRAFT status.',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Patch(':id/publish')
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    RecipeAllowedForOwnerGuard,
  )
  async publish(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<boolean> {
    return this.recipeService.updateStatus(id, RecipeStatusEnum.PREMODERATION);
  }

  @ApiOperation({
    summary: 'Видалення рецепту',
    description:
      'Повністю видаляє рецепт із бази даних. Операція незворотна. ' +
      "При видаленні також асинхронно видаляються пов'язані зображення з Cloudinary. " +
      'Доступно лише для власника рецепту. Вимагає підтвердженого email.',
  })
  @ApiCookieAuth('jwt-access')
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully deleted — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Email not confirmed or recipe does not belong to the current user.',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Delete(':id')
  @UseGuards(
    AuthGuard('jwt-access'),
    EmailVerificationGuard,
    RecipeAllowedForOwnerGuard,
  )
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<boolean> {
    return this.recipeService.remove(id);
  }
}
