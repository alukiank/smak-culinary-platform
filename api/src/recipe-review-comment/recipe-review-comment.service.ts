import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeReviewComment } from './entities/recipe-review-comment.entity';
import { CreateRecipeReviewCommentDto } from './dto/create-recipe-review-comment.dto';
import { PaginationMetaDto } from '../shared/dto/pagination-meta.dto';
import { PaginatedResponseDto } from '../shared/dto/paginated-response.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RecipeReviewCommentService {
  constructor(
    @InjectRepository(RecipeReviewComment)
    private readonly commentRepository: Repository<RecipeReviewComment>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    userId: string,
    reviewId: string,
    dto: CreateRecipeReviewCommentDto,
  ): Promise<RecipeReviewComment> {
    const comment = this.commentRepository.create({
      text: dto.text,
      user: { id: userId },
      review: { id: reviewId },
    });

    const savedComment = await this.commentRepository.save(comment);

    this.eventEmitter.emit('review-comment.created', reviewId);

    return savedComment;
  }

  async findByReview(
    reviewId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<RecipeReviewComment>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await this.commentRepository.findAndCount({
      where: {
        review: { id: reviewId },
      },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip: skip,
      take: limit,
    });

    return new PaginatedResponseDto(
      data,
      new PaginationMetaDto(totalCount, page, limit, data.length),
    );
  }

  async findOne(id: string): Promise<RecipeReviewComment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async remove(id: string): Promise<boolean> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['review'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    const reviewId = comment.review.id;

    await this.commentRepository.remove(comment);

    this.eventEmitter.emit('review-comment.deleted', reviewId);

    return true;
  }
}
