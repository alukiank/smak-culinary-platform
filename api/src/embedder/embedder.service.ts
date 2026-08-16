import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleAiService } from '../infrastructure/google-ai/services/google-ai.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeVector } from '../recipe/entities/recipe-vector.entity';
import { TaskTypeEnum } from './enums/task-type.enum';
import { Logger } from '@nestjs/common';

@Injectable()
export class EmbedderService {
  private readonly logger = new Logger(EmbedderService.name);

  constructor(
    private readonly googleAiService: GoogleAiService,
    @InjectRepository(RecipeVector)
    private readonly vectorRepository: Repository<RecipeVector>,
  ) {}

  async embedDocument(text: string, title: string): Promise<number[]> {
    return this.callGoogleEmbedder(text, TaskTypeEnum.R_DOCUMENT, title);
  }

  async embedQuery(query: string): Promise<number[]> {
    return this.callGoogleEmbedder(query, TaskTypeEnum.R_QUERY);
  }

  async callGoogleEmbedder(
    text: string,
    taskType: TaskTypeEnum,
    title?: string,
  ): Promise<number[]> {
    try {
      return await this.googleAiService.generateEmbeddings(
        text,
        taskType,
        title,
      );
    } catch (error) {
      this.logger.error(`AI Error [${taskType}]: ${error}`);
      throw new ServiceUnavailableException(
        'Failed to generate embeddings from AI provider. Please try again later.',
      );
    }
  }
}
