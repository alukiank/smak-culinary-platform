import { ChatMessageMetadataDto } from '../../chat/dto/create-message.dto';
import { SenderRoleEnum } from '../../chat/enums/sender-role.enum';

export interface AssistantResult {
  text: string;
  metadata?: ChatMessageMetadataDto;
  internalMessages: Array<{
    role: SenderRoleEnum;
    content: string;
    isInternal: boolean;
    toolData: {
      modelParts?: any[];
      functionResponses?: Array<{ name: string; response: any }>;
    } | null;
  }>;
}
