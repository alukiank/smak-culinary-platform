import { ChatMessageMetadataDto } from '../dto/create-message.dto';

export function mergeChatMetadata(
  target: ChatMessageMetadataDto,
  source: ChatMessageMetadataDto,
): ChatMessageMetadataDto {
  if (!target) return source || {};
  if (!source) return target || {};

  const result = { ...target, ...source };

  if (target.recipes && source.recipes) {
    const recipeMap = new Map<string, any>();
    for (const r of [...target.recipes, ...source.recipes]) {
      recipeMap.set(r.id, r);
    }
    result.recipes = Array.from(recipeMap.values());
  } else if (target.recipes) {
    result.recipes = [...target.recipes];
  } else if (source.recipes) {
    result.recipes = [...source.recipes];
  }

  return result;
}
