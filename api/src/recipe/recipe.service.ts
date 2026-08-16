import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { CreateRecipeDto } from './dto/recipe-create.dto';
import { UpdateRecipeDto } from './dto/recipe-update.dto';
import { RecipeVector } from './entities/recipe-vector.entity';
import { EmbedderService } from '../embedder/embedder.service';
import { PaginatedResponseDto } from '../shared/dto/paginated-response.dto';
import { PaginationMetaDto } from '../shared/dto/pagination-meta.dto';
import { RecipeSearchDto } from './dto/recipe-search.dto';
import { RecipeStatusEnum } from './enums/recipe-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecipeReviewService } from '../recipe-review/recipe-review.service';
import { CategoryEnum } from './enums/recipe-category.enum';
import { DifficultyEnum } from './enums/recipe-difficulty.enum';
import { CookSpeedEnum } from './enums/recipe-cook-speed.enum';

@Injectable()
export class RecipeService {
  private readonly logger = new Logger(RecipeService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeVector)
    private readonly vectorRepository: Repository<RecipeVector>,
    private readonly embedderService: EmbedderService,
    private eventEmitter: EventEmitter2,
    private readonly recipeReviewService: RecipeReviewService,
  ) { }

  async create(dto: CreateRecipeDto, userId: string): Promise<Recipe> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const recipe = queryRunner.manager.create(Recipe, {
        ...dto,
        user: { id: userId },
      });
      const savedRecipe = await queryRunner.manager.save(recipe);

      await queryRunner.commitTransaction();

      this.logger.log(
        `[Recipe] New recipe created: "${savedRecipe.title}" (ID: ${savedRecipe.id}) by user ${userId}`,
      );
      this.eventEmitter.emit('recipe.created', savedRecipe);

      return savedRecipe;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `[Recipe] Failed to create recipe for user ${userId}: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException('Failed to create recipe');
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdateRecipeDto): Promise<Recipe> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let oldCoverImageId: string | null = null;
    let oldGalleryImageIds: string[] = [];

    try {
      const recipe = await queryRunner.manager.findOne(Recipe, {
        where: { id },
        relations: ['vector'],
      });

      if (!recipe) throw new NotFoundException('Recipe not found');

      oldCoverImageId = recipe.coverImageId;
      oldGalleryImageIds = recipe.galleryImageIds || [];

      const isContentChanged =
        (dto.title && dto.title !== recipe.title) ||
        (dto.description !== undefined &&
          dto.description !== recipe.description) ||
        (dto.ingredients &&
          JSON.stringify(dto.ingredients) !==
          JSON.stringify(recipe.ingredients)) ||
        (dto.directions &&
          JSON.stringify(dto.directions) !==
          JSON.stringify(recipe.directions)) ||
        (dto.coverImageId !== undefined &&
          dto.coverImageId !== recipe.coverImageId) ||
        (dto.galleryImageIds &&
          JSON.stringify(dto.galleryImageIds) !==
          JSON.stringify(recipe.galleryImageIds));

      queryRunner.manager.merge(Recipe, recipe, dto);

      if (isContentChanged && recipe.status === RecipeStatusEnum.PUBLIC) {
        this.logger.log(
          `[Recipe] Recipe "${recipe.title}" (${id}) content changed. Moving back to PREMODERATION.`,
        );
        recipe.status = RecipeStatusEnum.PREMODERATION;
      }

      const updatedRecipe = await queryRunner.manager.save(recipe);

      await queryRunner.commitTransaction();

      this.logger.log(
        `[Recipe] Recipe updated: "${updatedRecipe.title}" (${id}). Content changed: ${isContentChanged}`,
      );

      this.eventEmitter.emit('recipe.updated', {
        recipe: updatedRecipe,
        isContentChanged,
        oldCoverImageId,
        oldGalleryImageIds,
      });

      return updatedRecipe;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException) throw err;
      this.logger.error(
        `[Recipe] Failed to update recipe ${id}: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException('Update failed');
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, status: RecipeStatusEnum): Promise<boolean> {
    this.logger.log(
      `[Recipe] Manually updating status for recipe ${id} to: ${status}`,
    );
    const result = await this.recipeRepository.update(id, { status });

    if (result.affected === 0) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    const recipe = await this.findOne(id);
    this.eventEmitter.emit('recipe.status.changed', recipe);

    return true;
  }

  async findOne(id: string): Promise<Recipe> {
    const recipe = await this.recipeRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!recipe) throw new NotFoundException();
    return recipe;
  }

  async findByIds(ids: string[]): Promise<Recipe[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.recipeRepository.find({
      where: {
        id: In(ids),
      },
    });
  }

  async remove(id: string): Promise<boolean> {
    const recipe = await this.findOne(id);

    const reviewImageIds =
      await this.recipeReviewService.getAllImageIdsByRecipe(id);

    this.logger.warn(`[Recipe] Deleting recipe: "${recipe.title}" (${id})`);

    const deleteResult = await this.recipeRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Recipe with this ID not found`);
    }

    this.eventEmitter.emit('recipe.deleted', {
      recipe,
      reviewImageIds,
    });

    return true;
  }

  async searchRecipesWithFilters(
    searchDto: RecipeSearchDto,
  ): Promise<PaginatedResponseDto<Recipe>> {
    const { query, page = 1, limit = 10, ...filters } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.user', 'user');

    if (query) {
      const queryEmbedding = await this.embedderService.embedQuery(query);
      if (queryEmbedding) {
        queryBuilder
          .innerJoin('recipe.vector', 'vector')
          .addSelect('vector.embedding <=> :queryVector::vector', 'distance')
          .andWhere('vector.embedding <=> :queryVector::vector <= 0.4')
          .setParameter('queryVector', JSON.stringify(queryEmbedding))
          .orderBy('distance', 'ASC');
      }
    } else {
      queryBuilder.orderBy('recipe.createdAt', 'DESC');
    }

    if (filters.status) {
      queryBuilder.andWhere('recipe.status = :status', {
        status: filters.status,
      });
    }

    if (filters.userId) {
      queryBuilder.andWhere('recipe.userId = :userId', {
        userId: filters.userId,
      });
    }

    const booleanFilters = [
      'isVegan',
      'isVegetarian',
      'isGluten_free',
      'isHalal',
      'isKosher',
      'isDairyFree',
      'isNutFree',
    ];

    booleanFilters.forEach((field) => {
      if (filters[field] !== undefined) {
        queryBuilder.andWhere(`recipe.${field} = :${field}`, {
          [field]: filters[field],
        });
      }
    });
    if (
      filters.category &&
      Object.values(CategoryEnum).includes(filters.category as any)
    ) {
      queryBuilder.andWhere('recipe.category = :category', {
        category: filters.category,
      });
    }
    if (
      filters.difficulty &&
      Object.values(DifficultyEnum).includes(filters.difficulty as any)
    ) {
      queryBuilder.andWhere('recipe.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }
    if (
      filters.cookSpeed &&
      Object.values(CookSpeedEnum).includes(filters.cookSpeed as any)
    ) {
      queryBuilder.andWhere('recipe.cookSpeed = :cookSpeed', {
        cookSpeed: filters.cookSpeed,
      });
    }
    if (filters.minHealthScore !== undefined) {
      queryBuilder.andWhere('recipe.healthScore >= :minHealthScore', {
        minHealthScore: filters.minHealthScore,
      });
    }
    if (filters.maxHealthScore !== undefined) {
      queryBuilder.andWhere('recipe.healthScore <= :maxHealthScore', {
        maxHealthScore: filters.maxHealthScore,
      });
    }
    if (filters.minRating !== undefined) {
      queryBuilder.andWhere('recipe.rating >= :minRating', {
        minRating: filters.minRating,
      });
    }
    if (filters.maxRating !== undefined) {
      queryBuilder.andWhere('recipe.rating <= :maxRating', {
        maxRating: filters.maxRating,
      });
    }
    if (filters.maxCookTime !== undefined) {
      queryBuilder.andWhere(
        '(recipe.cookTime + recipe.prepTime) <= :maxCookTime',
        { maxCookTime: filters.maxCookTime },
      );
    }

    if (filters.cuisineList && filters.cuisineList.length > 0) {
      queryBuilder.andWhere('recipe.cuisineList && :cuisines', {
        cuisines: filters.cuisineList,
      });
    }

    queryBuilder.skip(skip).take(limit);

    const [data, totalCount] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(
      data,
      new PaginationMetaDto(totalCount, page, limit, data.length),
    );
  }

  async getSimilarRecipes(
    recipeId: string,
    limit: number = 5,
  ): Promise<Recipe[]> {
    const targetRecipe = await this.vectorRepository.findOne({
      where: { recipe: { id: recipeId } },
    });

    if (!targetRecipe) return [];

    const recommendations = await this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.user', 'user')
      .innerJoin('recipe.vector', 'vector')
      .where('recipe.id != :id', { id: recipeId })
      .andWhere('recipe.status = :status', { status: RecipeStatusEnum.PUBLIC })
      .addSelect(`vector.embedding <=> :targetVector::vector`, 'distance')
      .setParameter('targetVector', JSON.stringify(targetRecipe.embedding))
      .orderBy('distance', 'ASC')
      .limit(limit)
      .getMany();

    return recommendations;
  }

  async updateRecipeRating(recipeId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder(Recipe, 'recipe')
        .where('recipe.id = :recipeId', { recipeId })
        .setLock('pessimistic_write')
        .getOne();

      const result = await manager
        .createQueryBuilder()
        .select('AVG(rating)', 'averageRating')
        .addSelect('COUNT(id)', 'totalRatings')
        .from('recipe_reviews', 'review')
        .where('review."recipeId" = :recipeId', { recipeId })
        .andWhere('review."isPublished" = :isPublished', { isPublished: true })
        .getRawOne();

      const avgRating = parseFloat(result.averageRating) || 0;
      const totalRatings = parseInt(result.totalRatings, 10) || 0;
      const roundedRating = Math.round(avgRating * 10) / 10;

      await manager.update(Recipe, recipeId, {
        rating: roundedRating,
        numRatings: totalRatings,
      });
    });
  }

  async banRecipesByUser(userId: string): Promise<void> {
    this.logger.log(
      `[Recipe] Banning all active recipes by user ID: ${userId}`,
    );
    await this.recipeRepository.update(
      {
        user: { id: userId },
        status: In([
          RecipeStatusEnum.PUBLIC,
          RecipeStatusEnum.PREMODERATION,
          RecipeStatusEnum.MODERATION,
        ]),
      },
      { status: RecipeStatusEnum.REJECTED },
    );
  }
}
