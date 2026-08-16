import { User } from '../../user/entities/user.entity';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { BASIC_ASSISTANT_PROMPT } from './prompts/assistant/basic-assistant.prompt';

import { RECIPE_MODERATOR_PROMPT } from './prompts/moderation/recipe-moderator.prompt';
import { ModerationType } from './enums/moderation-type.enum';
import { AssistantPersona } from './enums/assistant-persona.enum';
import { REVIEW_MODERATOR_PROMPT } from './prompts/moderation/review-moderator.prompt';

export class PromptBuilder {
  private static buildSystemInstruction(roleSpecificRules: string): string {
    return `${roleSpecificRules}`;
  }

  static buildModeratorPrompt(type: ModerationType): string {
    let rolePrompt = '';

    switch (type) {
      case ModerationType.RECIPE:
        rolePrompt = RECIPE_MODERATOR_PROMPT;
        break;
      case ModerationType.COMMENT:
      case ModerationType.REVIEW:
        rolePrompt = REVIEW_MODERATOR_PROMPT;
        break;
      default:
        throw new Error(`Unknown moderation type: ${type}`);
    }

    return this.buildSystemInstruction(rolePrompt);
  }

  static buildAssistantPrompt(
    user: User,
    persona: AssistantPersona = AssistantPersona.BASIC,
    recipe?: Recipe,
  ): string {
    let rolePrompt = '';

    switch (persona) {
      case AssistantPersona.BASIC:
        rolePrompt = BASIC_ASSISTANT_PROMPT;
        break;
      default:
        rolePrompt = BASIC_ASSISTANT_PROMPT;
    }

    const allergies = user.allergies?.length
      ? user.allergies.join(', ')
      : 'none';
    const diets = user.dietary?.length ? user.dietary.join(', ') : 'none';

    const userContext = `
        USER PROFILE:
        - Allergies: ${allergies}
        - Diets: ${diets}
        `;

    let finalPrompt = `${rolePrompt}\n\n${userContext}`;

    if (recipe) {
      finalPrompt += `\n\n${this.buildRecipeContextPrompt(recipe)}`;
    }

    return this.buildSystemInstruction(finalPrompt);
  }

  static buildRecipeContextPrompt(recipe: Recipe): string {
    const ingredientsList = recipe.ingredients?.length
      ? recipe.ingredients.map((i) => `- ${i}`).join('\n')
      : 'none';

    const directionsList = recipe.directions?.length
      ? recipe.directions.map((d, index) => `${index + 1}. ${d}`).join('\n')
      : 'none';

    return `
    === Recipe for cooking ===
    Title: ${recipe.title}
    Description: ${recipe.description || 'none'}
    Difficulty: ${recipe.difficulty}
    Prep time: ${recipe.prepTime ? recipe.prepTime + ' min' : 'none'}
    Cook time: ${recipe.cookTime ? recipe.cookTime + ' min' : 'none'}
    Ingredients:
    ${ingredientsList}

    Directions:
    ${directionsList}
    `;
  }
}
