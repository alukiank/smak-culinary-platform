import { Injectable, Logger } from '@nestjs/common';
import { Content, Tool } from '@google/genai';
import { GoogleAiService } from '../infrastructure/google-ai/services/google-ai.service';
import { ToolHandlerService } from './tools/tool-handler.service';
import { assistantTools } from './tools/assistant.tools';
import { AssistantResult } from './interfaces/assistant-result.inteface';
import { User } from '../user/entities/user.entity';
import { PromptBuilder } from '../shared/prompt-builder/prompt-builder';
import { AssistantPersona } from '../shared/prompt-builder/enums/assistant-persona.enum';
import { SenderRoleEnum } from '../chat/enums/sender-role.enum';
import { Message } from '../chat/entities/message.entity';
import { ChatMessageMetadataDto } from '../chat/dto/create-message.dto';
import { mergeChatMetadata } from '../chat/utils/merge-chat-metadata.util';
import { Recipe } from '../recipe/entities/recipe.entity';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly geminiService: GoogleAiService,
    private readonly toolHandlerService: ToolHandlerService,
  ) { }

  async generateResponse(
    history: Message[],
    chatId: string,
    user: User,
    persona: AssistantPersona = AssistantPersona.BASIC,
    recipe?: Recipe,
  ): Promise<AssistantResult> {
    const contents = this.mapMessagesToGeminiContent(history);
    const tools: Tool[] = [assistantTools];
    const systemInstruction = PromptBuilder.buildAssistantPrompt(
      user,
      persona,
      recipe,
    );

    this.logger.log(
      `[Chat:${chatId}] Starting Gemini AI response generation (User: ${user.id})`,
    );

    let response = await this.geminiService.sendGenerateContentRequest(
      contents,
      tools,
      systemInstruction,
    );

    let finalMetadata: ChatMessageMetadataDto = {};
    let accumulatedText = '';
    let iteration = 1;
    const internalMessages: AssistantResult['internalMessages'] = [];

    while (
      response.functionCalls &&
      response.functionCalls.length > 0 &&
      iteration <= 5
    ) {
      const parts = response.candidates?.[0]?.content?.parts || [];
      const textParts = parts
        .filter((part) => part.text)
        .map((part) => part.text);

      const turnText = textParts.join('');
      if (turnText) {
        accumulatedText += turnText;
      }

      this.logger.log(
        `[Chat:${chatId}] Gemini requested ${response.functionCalls.length} tool call(s) [Iteration: ${iteration}]`,
      );

      const rawModelParts = response.candidates?.[0]?.content?.parts || [];

      internalMessages.push({
        role: SenderRoleEnum.MODEL,
        content: turnText,
        isInternal: true,
        toolData: {
          modelParts: rawModelParts,
        },
      });

      contents.push(response.candidates[0].content);
      const functionResponsesParts = [];

      for (const call of response.functionCalls) {
        this.logger.debug(`[Chat:${chatId}] Executing tool: ${call.name}`);

        let result: any;
        let clientMetadata: any;

        try {
          const execution = await this.toolHandlerService.executeFunctionCall(
            call.name,
            call.args,
            chatId,
          );
          result = execution.result;
          clientMetadata = execution.clientMetadata;
        } catch (toolError) {
          this.logger.error(
            `[Chat:${chatId}] Tool execution threw an exception for ${call.name}: ${toolError.message}`,
            toolError.stack,
          );
          result = {
            error: `Failed to execute tool ${call.name} due to an internal error: ${toolError.message}`,
          };
        }

        if (clientMetadata) {
          finalMetadata = mergeChatMetadata(finalMetadata, clientMetadata);
        }

        functionResponsesParts.push({
          functionResponse: {
            name: call.name,
            response: { result: result },
          },
        });
      }

      internalMessages.push({
        role: SenderRoleEnum.USER,
        content: '',
        isInternal: true,
        toolData: {
          functionResponses: functionResponsesParts.map((frp) => ({
            name: frp.functionResponse.name,
            response: frp.functionResponse.response.result,
          })),
        },
      });

      contents.push({
        role: 'user',
        parts: functionResponsesParts,
      });

      this.logger.log(
        `[Chat:${chatId}] Sending tool results back to Gemini [Iteration: ${iteration}]`,
      );

      response = await this.geminiService.sendGenerateContentRequest(
        contents,
        tools,
        systemInstruction,
      );

      iteration++;
    }

    const finalParts = response.candidates?.[0]?.content?.parts || [];
    const finalTextParts = finalParts
      .filter((part) => part.text)
      .map((part) => part.text);

    if (finalTextParts.length > 0) {
      accumulatedText += finalTextParts.join('');
    }

    this.logger.log(
      `[Chat:${chatId}] Generation complete. Return ${Object.keys(finalMetadata).length > 0 ? 'with' : 'without'} metadata.`,
    );

    return {
      text: accumulatedText.trim(),
      metadata:
        Object.keys(finalMetadata).length > 0 ? finalMetadata : undefined,
      internalMessages,
    };
  }

  async *generateStreamResponse(
    history: Message[],
    chatId: string,
    user: User,
    persona: AssistantPersona = AssistantPersona.BASIC,
    recipe?: Recipe,
  ): AsyncGenerator<{
    type: 'text_chunk' | 'metadata' | 'error' | 'internal_message';
    data?: any;
  }> {
    const contents = this.mapMessagesToGeminiContent(history);
    const tools: Tool[] = [assistantTools];
    const systemInstruction = PromptBuilder.buildAssistantPrompt(
      user,
      persona,
      recipe,
    );

    this.logger.log(
      `[Chat:${chatId}] Starting Gemini AI STREAM generation (User: ${user.id})`,
    );

    let iteration = 1;
    let isDone = false;

    while (!isDone && iteration <= 20) {
      this.logger.log(
        `[Chat:${chatId}] Requesting stream [Iteration: ${iteration}]`,
      );

      const stream = await this.geminiService.sendGenerateContentStreamRequest(
        contents,
        tools,
        systemInstruction,
      );

      const functionCalls = [];
      const rawFunctionCallParts: any[] = [];
      let turnText = '';

      for await (const chunk of stream) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];

        const textParts = parts
          .filter((part) => part.text)
          .map((part) => part.text);
        if (textParts.length > 0) {
          const chunkText = textParts.join('');
          turnText += chunkText;
          yield { type: 'text_chunk', data: chunkText };
        }

        const fcParts = parts.filter((part) => part.functionCall);
        if (fcParts.length > 0) {
          rawFunctionCallParts.push(...fcParts);
        }

        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          functionCalls.push(...chunk.functionCalls);
        }
      }

      if (functionCalls.length > 0) {
        this.logger.log(
          `[Chat:${chatId}] Gemini requested ${functionCalls.length} tool call(s) [Iteration: ${iteration}]`,
        );

        const modelParts: any[] = [];
        if (turnText) {
          modelParts.push({ text: turnText });
        }
        modelParts.push(...rawFunctionCallParts);

        yield {
          type: 'internal_message',
          data: {
            role: SenderRoleEnum.MODEL,
            content: turnText,
            isInternal: true,
            toolData: {
              modelParts: modelParts,
            },
          },
        };

        contents.push({
          role: 'model',
          parts: modelParts,
        });

        const functionResponsesParts = [];

        for (const call of functionCalls) {
          this.logger.debug(`[Chat:${chatId}] Executing tool: ${call.name}`);

          let result: any;
          let clientMetadata: any;

          try {
            const execution = await this.toolHandlerService.executeFunctionCall(
              call.name,
              call.args,
              chatId,
            );
            result = execution.result;
            clientMetadata = execution.clientMetadata;
          } catch (toolError) {
            this.logger.error(
              `[Chat:${chatId}] Tool execution threw an exception for ${call.name}: ${toolError.message}`,
              toolError.stack,
            );
            result = {
              error: `Failed to execute tool ${call.name} due to an internal error: ${toolError.message}`,
            };
          }

          if (clientMetadata) {
            yield { type: 'metadata', data: clientMetadata };

            const placeholders = this.getToolPlaceholders(clientMetadata);
            if (placeholders) {
              yield { type: 'text_chunk', data: placeholders };
            }
          }

          functionResponsesParts.push({
            functionResponse: {
              name: call.name,
              response: { result: result },
            },
          });
        }

        yield {
          type: 'internal_message',
          data: {
            role: SenderRoleEnum.USER,
            content: '',
            isInternal: true,
            toolData: {
              functionResponses: functionResponsesParts.map((frp) => ({
                name: frp.functionResponse.name,
                response: frp.functionResponse.response.result,
              })),
            },
          },
        };

        contents.push({
          role: 'user',
          parts: functionResponsesParts,
        });

        iteration++;

      } else {
        isDone = true;
      }
    }

    this.logger.log(`[Chat:${chatId}] Stream generation complete.`);
  }

  private mapMessagesToGeminiContent(history: Message[]): Content[] {
    const contents: Content[] = [];

    for (const msg of history) {
      if (msg.toolData) {
        if (msg.role === SenderRoleEnum.MODEL && msg.toolData.modelParts) {
          contents.push({ role: 'model', parts: msg.toolData.modelParts });
        }

        if (msg.role === SenderRoleEnum.USER && msg.toolData.functionResponses) {
          const parts = msg.toolData.functionResponses.map((fr) => ({
            functionResponse: { name: fr.name, response: { result: fr.response } },
          }));
          contents.push({ role: 'user', parts });
        }
        continue;
      }

      const currentRole = msg.role === SenderRoleEnum.USER ? 'user' : 'model';
      const cleanContent = this.stripToolPlaceholders(msg.content);
      const lastEntry =
        contents.length > 0 ? contents[contents.length - 1] : null;

      if (lastEntry && lastEntry.role === currentRole) {
        lastEntry.parts.push({ text: cleanContent });
      } else {
        contents.push({
          role: currentRole as any,
          parts: [{ text: cleanContent }],
        });
      }
    }
    return contents;
  }

  private stripToolPlaceholders(text: string): string {
    if (!text) return '';
    return text.replace(/\[Recipe:[^\]]*\]|\[Diets\]|\[Allergies\]/g, '');
  }

  private getToolPlaceholders(metadata: ChatMessageMetadataDto): string | null {
    const parts: string[] = [];

    if (metadata.recipes?.length > 0) {
      parts.push(metadata.recipes.map((r) => `[Recipe:${r.id}]`).join(''));
    }
    if (metadata.showDiets) {
      parts.push('[Diets]');
    }
    if (metadata.showAllergies) {
      parts.push('[Allergies]');
    }

    return parts.length > 0 ? `\n${parts.join('')}\n` : null;
  }
}
