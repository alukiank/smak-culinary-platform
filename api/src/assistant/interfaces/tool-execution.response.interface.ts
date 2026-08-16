import { ChatMessageMetadataDto } from '../../chat/dto/create-message.dto';

export interface ToolExecutionResponse {
  result: Record<string, any> | Record<string, any>[] | { error: string };
  clientMetadata?: ChatMessageMetadataDto;
}
