import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Chat } from '../../chat/entities/chat.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';

import { CursorPaginationMetaDto } from '../../shared/dto/cursor-pagination-meta.dto';
import { CursorPaginatedResponseDto } from '../../shared/dto/cursor-paginated-response.dto';
import { CursorPaginationDto } from '../../shared/dto/cursor-pagination.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SenderRoleEnum } from '../enums/sender-role.enum';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(chatId: string, dto: CreateMessageDto): Promise<Message> {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['user'],
    });
    if (!chat) {
      throw new NotFoundException(`Chat with this ID not found`);
    }

    const message = this.messageRepo.create({
      ...dto,
      chat: { id: chatId } as Chat,
    });

    const savedMessage = await this.messageRepo.save(message);

    await this.chatRepo.update(chatId, {
      messageCount: chat.messageCount + 1,
      updatedAt: new Date(),
    });

    this.eventEmitter.emit('message.created', {
      message: savedMessage,
      userId: chat.user?.id,
    });

    return savedMessage;
  }

  async findAll(chatId: string): Promise<Message[]> {
    return await this.messageRepo.find({
      where: { chat: { id: chatId } },
      order: { createdAt: 'ASC' },
    });
  }

  async findRecentDialoguesWithSmartContext(
    chatId: string,
    limitDialogues: number = 10,
    limitTools: number = 3,
  ): Promise<Message[]> {
    const userMessages = await this.messageRepo.find({
      where: {
        chat: { id: chatId },
        role: SenderRoleEnum.USER,
        isInternal: false,
      },
      order: { createdAt: 'DESC' },
      take: limitDialogues,
    });

    if (userMessages.length === 0) {
      return [];
    }

    const oldestUserMsg = userMessages[userMessages.length - 1];
    const globalCutoff = oldestUserMsg.createdAt;

    const toolCutoffIndex = Math.min(limitTools - 1, userMessages.length - 1);
    const toolCutoff = userMessages[toolCutoffIndex].createdAt;

    const allMessages = await this.messageRepo.createQueryBuilder('message')
      .where('message.chatId = :chatId', { chatId })
      .andWhere('message.createdAt >= :globalCutoff', { globalCutoff })
      .orderBy('message.createdAt', 'ASC')
      .getMany();

    return allMessages.filter((msg) => {
      if (!msg.isInternal) {
        return true;
      }
      return msg.createdAt.getTime() >= toolCutoff.getTime();
    });
  }

  async findAllWithPagination(
    chatId: string,
    paginationDto: CursorPaginationDto,
  ): Promise<CursorPaginatedResponseDto<Message>> {
    const { cursor, limit = 20 } = paginationDto;

    const queryBuilder = this.messageRepo
      .createQueryBuilder('message')
      .where('message.chatId = :chatId', { chatId })
      .andWhere('message.isInternal = :isInternal', { isInternal: false })
      .orderBy('message.createdAt', 'DESC')
      .addOrderBy('message.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const [cursorDateString, cursorId] = cursor.split('_');
      const cursorDate = new Date(cursorDateString);

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('message.createdAt < :cursorDate', { cursorDate }).orWhere(
            '(message.createdAt = :cursorDate AND message.id < :cursorId)',
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
      ? `${items[items.length - 1].createdAt.toISOString()}_${items[items.length - 1].id}`
      : null;
    const sortedItems = items.reverse();

    const meta = new CursorPaginationMetaDto(
      nextCursor,
      hasNextPage,
      limit,
      items.length,
    );

    return new CursorPaginatedResponseDto(sortedItems, meta);
  }

  async findOneOrThrow(id: string): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async update(id: string, dto: UpdateMessageDto): Promise<Message> {
    const message = await this.findOneOrThrow(id);

    if (dto.metadata) {
      message.metadata = { ...message.metadata, ...dto.metadata };
    }

    if (dto.content) {
      message.content = dto.content;
    }

    return await this.messageRepo.save(message);
  }

  async remove(id: string): Promise<void> {
    const message = await this.findOneOrThrow(id);
    const chatId = message.chat.id;

    await this.messageRepo.remove(message);

    await this.chatRepo.decrement({ id: chatId }, 'messageCount', 1);
  }
}
