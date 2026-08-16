import type { RecipeResponseDto } from '~/types/recipe'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMissingIngredients(missing: string[]): string {
  if (missing.length === 0) return ''
  return missing.join(', ')
}

// ─── Quick Action Prompts (Simplified, relying on backend recipe context) ──────

/**
 * "Чим замінити інгредієнти?" button.
 */
export function buildReplacementQuery(
  recipe: RecipeResponseDto,
  stepIndex: number,
  missingIngredients: string[],
): string {
  const missingText = formatMissingIngredients(missingIngredients)
  if (missingText) {
    return `Чим можна замінити відсутні інгредієнти (${missingText}) на кроці №${stepIndex + 1}?`
  }
  return `Чим можна замінити інгредієнти на кроці №${stepIndex + 1}, якщо деяких немає вдома?`
}

/**
 * "Поясни техніку приготування" button.
 */
export function buildTechniqueQuery(
  recipe: RecipeResponseDto,
  stepIndex: number,
): string {
  return `Поясни детально техніку приготування на кроці №${stepIndex + 1}. Що саме потрібно зробити і на що звернути увагу?`
}

/**
 * "Порада по кроку" button.
 */
export function buildGeneralTipQuery(
  recipe: RecipeResponseDto,
  stepIndex: number,
): string {
  return `Дай мені корисну пораду або лайфхак для кроку №${stepIndex + 1}.`
}

/**
 * "Скільки часу тримати на вогні?" button.
 */
export function buildTimingQuery(
  recipe: RecipeResponseDto,
  stepIndex: number,
): string {
  return `Скільки часу потрібно готувати на кроці №${stepIndex + 1}? Які ознаки готовності?`
}
