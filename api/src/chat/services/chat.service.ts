import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { CreateChatDto } from '../dto/create-chat.dto';
import { UpdateChatDto } from '../dto/update-chat.dto';
import { User } from '../../user/entities/user.entity';
import { CursorPaginatedResponseDto } from '../../shared/dto/cursor-paginated-response.dto';
import { CursorPaginationMetaDto } from '../../shared/dto/cursor-pagination-meta.dto';
import { CursorPaginationDto } from '../../shared/dto/cursor-pagination.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private readonly chatRepo: Repository<Chat>,
  ) {}

  async create(userId: string, createChatDto: CreateChatDto): Promise<Chat> {
    const newChat = this.chatRepo.create({
      ...createChatDto,
      user: { id: userId } as User,
    });

    return await this.chatRepo.save(newChat);
  }

  async findAllWithPagination(
    userId: string,
    paginationDto: CursorPaginationDto,
  ): Promise<CursorPaginatedResponseDto<Chat>> {
    const { cursor, limit = 15 } = paginationDto;

    const queryBuilder = this.chatRepo
      .createQueryBuilder('chat')
      .where('chat.userId = :userId', { userId })
      .orderBy('chat.updatedAt', 'DESC')
      .addOrderBy('chat.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const [cursorDateString, cursorId] = cursor.split('_');
      const cursorDate = new Date(cursorDateString);

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('chat.updatedAt < :cursorDate', { cursorDate }).orWhere(
            '(chat.updatedAt = :cursorDate AND chat.id < :cursorId)',
            {
              cursorDate,
              cursorId,
            },
          );
        }),
      );
    }

    const data = await queryBuilder.getMany();

    const hasNextPage = data.length > limit;
    const items = hasNextPage ? data.slice(0, limit) : data;

    const nextCursor = hasNextPage
      ? `${items[items.length - 1].updatedAt.toISOString()}_${items[items.length - 1].id}`
      : null;

    const meta = new CursorPaginationMetaDto(
      nextCursor,
      hasNextPage,
      limit,
      items.length,
    );

    return new CursorPaginatedResponseDto(items, meta);
  }

  async findOne(id: string, userId: string): Promise<Chat> {
    const chat = await this.chatRepo.findOne({
      where: { id, user: { id: userId } },
    });
    return chat;
  }

  async findOneWithRelatedMessages(id: string, userId: string): Promise<Chat> {
    const chat = await this.chatRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['messages'],
      order: { createdAt: 'ASC' },
    });

    return chat;
  }

  async update(
    id: string,
    userId: string,
    updateChatDto: UpdateChatDto,
  ): Promise<Chat> {
    const chat = await this.findOne(id, userId);
    if (!chat) {
      throw new NotFoundException(`Chat with this ID not found`);
    }
    Object.assign(chat, updateChatDto);
    return await this.chatRepo.save(chat);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const chat = await this.findOne(id, userId);
    if (!chat) {
      throw new NotFoundException(`Chat with this ID not found`);
    }
    await this.chatRepo.remove(chat);
    return true;
  }
}
