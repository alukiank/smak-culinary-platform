import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { RecipeReview } from './entities/recipe-review.entity';
import { CreateRecipeReviewDto } from './dto/create-recipe-review.dto';
import { UpdateRecipeReviewDto } from './dto/update-recipe-review.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationMetaDto } from '../shared/dto/pagination-meta.dto';
import { PaginatedResponseDto } from '../shared/dto/paginated-response.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';

@Injectable()
export class RecipeReviewService {
  private readonly logger = new Logger(RecipeReviewService.name);

  constructor(
    @InjectRepository(RecipeReview)
    private readonly reviewRepository: Repository<RecipeReview>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    userId: string,
    recipeId: string,
    dto: CreateRecipeReviewDto,
  ): Promise<RecipeReview> {
    try {
      const review = this.reviewRepository.create({
        ...dto,
        user: { id: userId },
        recipe: { id: recipeId },
      });
      const savedReview = await this.reviewRepository.save(review);
      this.logger.log(
        `[Review] New review created for recipe ${recipeId} by user ${userId}. (ID: ${savedReview.id})`,
      );
      this.eventEmitter.emit('recipe-review.created', {
        recipeId,
        reviewId: savedReview.id,
      });
      return savedReview;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError || error;
        if (driverError.code === '23505') {
          this.logger.warn(
            `[Review] Duplicate review attempt by user ${userId} for recipe ${recipeId}`,
          );
          throw new BadRequestException(
            'You have already reviewed this recipe.',
          );
        }
      }
      this.logger.error(
        `[Review] Failed to create review: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAllByRecipe(
    recipeId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<RecipeReview>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await this.reviewRepository.findAndCount({
      where: {
        recipe: { id: recipeId },
        isPublished: true,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: skip,
      take: limit,
    });

    return new PaginatedResponseDto(
      data,
      new PaginationMetaDto(totalCount, page, limit, data.length),
    );
  }

  async findAll(
    paginationDto: PaginationDto,
    isPublished?: boolean,
  ): Promise<PaginatedResponseDto<RecipeReview>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await this.reviewRepository.findAndCount({
      where: {
        ...(isPublished !== undefined && { isPublished }),
      },
      relations: ['user', 'recipe'],
      order: { createdAt: 'DESC' },
      skip: skip,
      take: limit,
    });

    return new PaginatedResponseDto(
      data,
      new PaginationMetaDto(totalCount, page, limit, data.length),
    );
  }

  async findOne(id: string, isPublished?: boolean): Promise<RecipeReview> {
    const review = await this.reviewRepository.findOne({
      where: { id, ...(isPublished !== undefined && { isPublished }) },
      relations: ['user', 'recipe'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async getAllImageIdsByRecipe(recipeId: string): Promise<string[]> {
    const reviews = await this.reviewRepository.find({
      where: { recipe: { id: recipeId } },
      select: ['id', 'imageId'],
    });

    return reviews
      .map((review) => review.imageId)
      .filter((id): id is string => !!id);
  }

  async update(id: string, dto: UpdateRecipeReviewDto): Promise<RecipeReview> {
    const review = await this.findOne(id);

    Object.assign(review, dto);

    const updatedReview = await this.reviewRepository.save(review);
    this.eventEmitter.emit('recipe-review.updated', {
      recipeId: updatedReview.recipe.id,
      reviewId: updatedReview.id,
    });

    return updatedReview;
  }

  async remove(id: string): Promise<boolean> {
    const review = await this.findOne(id);

    this.logger.warn(
      `[Review] Deleting review ${id} (Recipe: ${review.recipe.id})`,
    );
    await this.reviewRepository.remove(review);

    this.eventEmitter.emit('recipe-review.deleted', {
      recipeId: review.recipe.id,
      reviewImageIds: review.imageId ? [review.imageId] : [],
    });

    return true;
  }

  async updatePublishStatus(
    id: string,
    isPublished: boolean,
  ): Promise<boolean> {
    this.logger.log(
      `[Review] Updating publication status for review ${id} to: ${isPublished}`,
    );
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['recipe'],
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    review.isPublished = isPublished;
    await this.reviewRepository.save(review);

    this.eventEmitter.emit('recipe-review.status.changed', {
      recipeId: review.recipe.id,
      reviewId: review.id,
      isPublished,
    });

    return true;
  }

  async banReviewsByUser(userId: string): Promise<string[]> {
    this.logger.log(`[Review] Banning all reviews by user ID: ${userId}`);
    const reviews = await this.reviewRepository.find({
      where: { user: { id: userId }, isPublished: true },
      relations: ['recipe'],
    });

    if (reviews.length === 0) {
      return [];
    }

    await this.reviewRepository.update(
      { user: { id: userId } },
      { isPublished: false },
    );

    const affectedRecipeIds = [...new Set(reviews.map((r) => r.recipe.id))];

    for (const recipeId of affectedRecipeIds) {
      this.eventEmitter.emit('recipe-review.status.changed', { recipeId });
    }

    return affectedRecipeIds;
  }

  async getAuthorStats(
    authorId: string,
  ): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.recipe', 'recipe')
      .innerJoin('recipe.user', 'author')
      .where('author.id = :authorId', { authorId })
      .andWhere('review.isPublished = :isPublished', { isPublished: true })
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .getRawOne();

    const avg = result?.averageRating ? parseFloat(result.averageRating) : 0;
    return {
      averageRating: parseFloat(avg.toFixed(1)),
      totalReviews: result?.totalReviews ? parseInt(result.totalReviews, 10) : 0,
    };
  }

  async findAllByAuthor(
    authorId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<RecipeReview>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await this.reviewRepository.findAndCount({
      where: {
        recipe: {
          user: { id: authorId },
        },
        isPublished: true,
      },
      relations: ['user', 'recipe'],
      order: { createdAt: 'DESC' },
      skip: skip,
      take: limit,
    });

    return new PaginatedResponseDto(
      data,
      new PaginationMetaDto(totalCount, page, limit, data.length),
    );
  }
}
