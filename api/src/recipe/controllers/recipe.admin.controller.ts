import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Delete,
  Put,
  Body,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RecipeService } from '../recipe.service';
import { RecipeSearchDto } from '../dto/recipe-search.dto';
import { CreateRecipeDto } from '../dto/recipe-create.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRoleEnum } from '../../user/enums/user-role.enum';
import { RolesAllowed } from '../../auth/decorators/roles-allowed.decorator';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { UpdateRecipeStatusDto } from '../dto/recipe-update-status.dto';
import { plainToInstance } from 'class-transformer';
import { RecipeAdminResponseDto } from '../dto/recipe-admin-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin/Recipes')
@ApiCookieAuth('jwt-access')
@UseGuards(AuthGuard('jwt-access'), RolesGuard)
@RolesAllowed(UserRoleEnum.ADMIN)
@Controller('admin/recipes')
export class RecipeAdminController {
  constructor(private readonly recipeService: RecipeService) {}

  @ApiOperation({
    summary: '[ADMIN] Пошук рецептів з усіма деталями',
    description:
      'Адміністраторський пошук рецептів з повним набором фільтрів та без обмежень за статусом. ' +
      'На відміну від публічного API, показує рецепти з будь-яким статусом: ' +
      'public, draft, archived, rejected, premoderation, moderation. ' +
      'Повертає розширений DTO (RecipeAdminResponseDto), що включає повні дані автора (UserPrivateDto з email, роллю тощо). ' +
      'Якщо вказано query — результати сортуються за семантичною близькістю (pgvector), інакше — за датою створення.',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Текстовий запит для семантичного пошуку.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Фільтр за статусом: public | draft | archived | rejected | premoderation | moderation.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Фільтр за UUID автора.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Фільтр за категорією.',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    description: 'Складність: easy | medium | hard.',
  })
  @ApiQuery({
    name: 'cookSpeed',
    required: false,
    description: 'Швидкість: fast | medium | slow.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Сторінка (за замовчуванням 1).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Кількість на сторінку (за замовчуванням 10).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Список рецептів з метаданими пагінації (розширений адміністраторський DTO).',
    schema: {
      example: {
        data: [
          {
            id: 'recipe-uuid',
            title: 'Борщ',
            status: 'moderation',
            user: {
              id: 'user-uuid',
              email: 'author@example.com',
              role: 'user',
            },
          },
        ],
        meta: {
          totalItems: 50,
          itemCount: 10,
          itemsPerPage: 10,
          totalPages: 5,
          currentPage: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @Get()
  async searchAdmin(
    @Query() searchDto: RecipeSearchDto,
  ): Promise<PaginatedResponseDto<RecipeAdminResponseDto>> {
    const paginatedResult =
      await this.recipeService.searchRecipesWithFilters(searchDto);

    return {
      ...paginatedResult,
      data: plainToInstance(RecipeAdminResponseDto, paginatedResult.data, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @ApiOperation({
    summary: '[ADMIN] Отримання рецепту за ID (повна інформація)',
    description:
      'Повертає повні дані рецепту незалежно від його статусу. ' +
      'Включає розширені дані автора (UserPrivateDto) з email, роллю та статусом верифікації. ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Розширені дані рецепту.',
    type: RecipeAdminResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Get(':id')
  async findOneAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<RecipeAdminResponseDto> {
    const recipe = await this.recipeService.findOne(id);
    return plainToInstance(RecipeAdminResponseDto, recipe, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: '[ADMIN] Оновлення рецепту (адміністраторське)',
    description:
      'Дозволяє адміністратору оновити будь-який рецепт у системі. ' +
      'На відміну від власника, оновлення адміністратором не призводить до автоматичної зміни статусу. ' +
      'Після оновлення асинхронно регенерується векторне вбудовування якщо змінився контент. ' +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({
    status: 200,
    description: 'Рецепт успішно оновлено (розширений DTO).',
    type: RecipeAdminResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during update.',
  })
  @Put(':id')
  async updateAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateRecipeDto: CreateRecipeDto,
  ): Promise<RecipeAdminResponseDto> {
    const updatedRecipe = await this.recipeService.update(id, updateRecipeDto);
    return plainToInstance(RecipeAdminResponseDto, updatedRecipe, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: '[ADMIN] Зміна статусу рецепту',
    description:
      'Дозволяє адміністратору встановити будь-який статус рецепту вручну. ' +
      'Доступні статуси: public, draft, archived, rejected, premoderation, moderation. ' +
      'Зазвичай використовується для затвердження або відхилення рецептів, ' +
      'що знаходяться на стадії модерації. Для зміни статусу через систему модерації ' +
      'з веденням логів використовуйте POST /admin/moderation/recipe/:id.',
  })
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiBody({ type: UpdateRecipeStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Status successfully changed — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Patch(':id/status')
  async updateStatusAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecipeStatusDto,
  ): Promise<boolean> {
    return this.recipeService.updateStatus(id, dto.status);
  }

  @ApiOperation({
    summary: '[ADMIN] Видалення рецепту',
    description:
      'Примусово видаляє будь-який рецепт із системи незалежно від його статусу та власника. ' +
      "Операція незворотна. При видаленні також асинхронно видаляються пов'язані зображення з Cloudinary. " +
      'Доступно лише для адміністраторів.',
  })
  @ApiParam({ name: 'id', description: 'UUID рецепту.', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully deleted — returns true.',
    schema: { example: true },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Recipe not found.' })
  @Delete(':id')
  async deleteAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<boolean> {
    return this.recipeService.remove(id);
  }
}
