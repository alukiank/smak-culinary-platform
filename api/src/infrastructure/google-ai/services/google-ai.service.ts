import { Injectable, Logger } from '@nestjs/common';
import { GOOGLE_AI_CONSTANTS } from '../google-ai.constants';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenAI,
  Content,
  Tool,
  GenerateContentResponse,
} from '@google/genai';

@Injectable()
export class GoogleAiService {
  private readonly ai: GoogleGenAI;
  private readonly defaultModel: string;
  private readonly logger = new Logger(GoogleAiService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
    this.defaultModel = this.configService.get<string>('GEMINI_MODEL_NAME');
  }

  async generateText(
    prompt: string,
    systemInstruction?: string,
  ): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      return response.text;
    } catch (error) {
      this.logger.error('Error in GoogleAiService.generateText:', error);
      throw error;
    }
  }

  async sendGenerateContentRequest(
    contents: Content[],
    tools?: Tool[],
    systemInstruction?: string,
    responseSchema?: any,
  ): Promise<GenerateContentResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: contents,
        config: {
          tools: tools,
          systemInstruction: systemInstruction,
          responseSchema: responseSchema,
          responseMimeType: responseSchema
            ? GOOGLE_AI_CONSTANTS.MIME_TYPES.JSON
            : GOOGLE_AI_CONSTANTS.MIME_TYPES.TEXT,
          temperature: 0.3,
          toolConfig: tools && tools.length > 0 ? {
            functionCallingConfig: {
              mode: 'AUTO' as any,
            },
          } : undefined,
        },
      });

      return response;
    } catch (error) {
      this.logger.error(
        'Error in GoogleAiService.sendGenerateContentRequest:',
        error,
      );
      throw error;
    }
  }

  async sendGenerateContentStreamRequest(
    contents: Content[],
    tools?: Tool[],
    systemInstruction?: string,
    responseSchema?: any,
  ): Promise<AsyncGenerator<GenerateContentResponse, any, unknown>> {
    try {
      const stream = await this.ai.models.generateContentStream({
        model: this.defaultModel,
        contents: contents,
        config: {
          tools: tools,
          systemInstruction: systemInstruction,
          responseSchema: responseSchema,
          responseMimeType: responseSchema
            ? GOOGLE_AI_CONSTANTS.MIME_TYPES.JSON
            : GOOGLE_AI_CONSTANTS.MIME_TYPES.TEXT,
          temperature: 0.3,
          toolConfig: tools && tools.length > 0 ? {
            functionCallingConfig: {
              mode: 'AUTO' as any,
            },
          } : undefined,
        },
      });

      return stream;
    } catch (error) {
      this.logger.error(
        'Error in GoogleAiService.sendGenerateContentStreamRequest:',
        error,
      );
      throw error;
    }
  }

  async generateEmbeddings(
    text: string,
    taskType: string,
    title?: string,
  ): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: this.configService.get<string>('EMBEDDING_MODEL_NAME'),
        contents: [{ parts: [{ text }] }],
        config: {
          taskType: taskType as any,
          outputDimensionality: GOOGLE_AI_CONSTANTS.EMBEDDING_DIMENSIONS,
          title: title,
        },
      });

      return response.embeddings[0].values;
    } catch (error) {
      this.logger.error(
        `Error in GoogleAiService.generateEmbeddings [${taskType}]: ${error}`,
      );
      throw error;
    }
  }
}
