<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import type { ChatMessageDto, ChatMessageRecipeRef } from '~/types/chat'

interface Props {
  message: ChatMessageDto
  isStreaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
})

const isUser = computed(() => props.message.role === 'user')

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
})

const cleanContent = computed(() => {
  let content = props.message.content || ''
  if (props.isStreaming && !isUser.value) {
    // Strip partial placeholder tags at the end of the text stream to prevent raw text flash
    content = content.replace(/\[R(?:e(?:c(?:i(?:p(?:e(?::(?:[a-zA-Z0-9_-]*)?)?)?)?)?)?)?$/, '')
    content = content.replace(/\[D(?:i(?:e(?:t(?:s)?)?)?)?$/, '')
    content = content.replace(/\[A(?:l(?:l(?:e(?:r(?:g(?:i(?:e(?:s)?)?)?)?)?)?)?)?$/, '')
  }
  return content
})

const PLACEHOLDER_REGEX = /\[Recipe:([a-zA-Z0-9_-]+)\]|\[Diets\]|\[Allergies\]/g

const parsedMessageBlocks = computed(() => {
  const content = cleanContent.value
  if (!content) return []
  if (isUser.value) {
    return [{ type: 'text' as const, value: content }]
  }

  const rawBlocks: Array<{ type: 'text' | 'recipe' | 'diets' | 'allergies'; value: string }> = []
  let lastIndex = 0
  let match

  PLACEHOLDER_REGEX.lastIndex = 0

  while ((match = PLACEHOLDER_REGEX.exec(content)) !== null) {
    const matchIndex = match.index

    if (matchIndex > lastIndex) {
      rawBlocks.push({
        type: 'text',
        value: content.substring(lastIndex, matchIndex),
      })
    }

    if (match[1]) {
      rawBlocks.push({ type: 'recipe', value: match[1] })
    } else if (match[0] === '[Diets]') {
      rawBlocks.push({ type: 'diets', value: '' })
    } else if (match[0] === '[Allergies]') {
      rawBlocks.push({ type: 'allergies', value: '' })
    }

    lastIndex = PLACEHOLDER_REGEX.lastIndex
  }

  if (lastIndex < content.length) {
    rawBlocks.push({
      type: 'text',
      value: content.substring(lastIndex),
    })
  }

  const blocks: Array<
    | { type: 'text'; value: string }
    | { type: 'recipes'; recipes: ChatMessageRecipeRef[]; rawIds: string[] }
    | { type: 'diets' }
    | { type: 'allergies' }
  > = []

  let currentRecipeGroup: string[] = []

  const createRecipeBlock = (ids: string[]) => {
    const resolved = ids
      .map(id => getRecipeById(id))
      .filter((r): r is ChatMessageRecipeRef => !!r)
    return {
      type: 'recipes' as const,
      recipes: resolved,
      rawIds: [...ids],
    }
  }

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i]
    if (!block) continue
    if (block.type === 'recipe') {
      currentRecipeGroup.push(block.value)
    } else if (block.type === 'diets' || block.type === 'allergies') {
      if (currentRecipeGroup.length > 0) {
        blocks.push(createRecipeBlock(currentRecipeGroup))
        currentRecipeGroup = []
      }
      blocks.push({ type: block.type })
    } else {
      const isWhitespace = /^\s*$/.test(block.value)
      const nextBlock = rawBlocks[i + 1]
      const isNextDisplayBlock = nextBlock && nextBlock.type !== 'text'

      if (isWhitespace && isNextDisplayBlock) {
        continue
      }

      if (currentRecipeGroup.length > 0) {
        blocks.push(createRecipeBlock(currentRecipeGroup))
        currentRecipeGroup = []
      }

      blocks.push({
        type: 'text',
        value: block.value,
      })
    }
  }

  if (currentRecipeGroup.length > 0) {
    blocks.push(createRecipeBlock(currentRecipeGroup))
  }

  return blocks
})

const getRecipeById = (id: string | undefined) => {
  if (!id) return undefined
  return props.message.metadata?.recipes?.find(r => r.id === id)
}

const unusedRecipes = computed(() => {
  if (isUser.value || !hasRecipes.value) return []
  const content = props.message.content || ''
  const usedIds = new Set<string>()
  
  const regex = /\[Recipe:([a-zA-Z0-9_-]+)\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      usedIds.add(match[1])
    }
  }
  
  return props.message.metadata?.recipes?.filter(r => !usedIds.has(r.id)) ?? []
})

// Fallback flags for old messages without inline placeholders
const hasDietsPlaceholder = computed(() => (props.message.content || '').includes('[Diets]'))
const hasAllergiesPlaceholder = computed(() => (props.message.content || '').includes('[Allergies]'))
const showFallbackDiets = computed(() => !!props.message.metadata?.showDiets && !hasDietsPlaceholder.value)
const showFallbackAllergies = computed(() => !!props.message.metadata?.showAllergies && !hasAllergiesPlaceholder.value)

const formattedTime = computed(() => {
  return new Date(props.message.createdAt).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const hasRecipes = computed(
  () => (props.message.metadata?.recipes?.length ?? 0) > 0,
)

// --- Interactive Restrictions Support ---
import { ref, watch } from 'vue'
import { useUser } from '~/composables/useUser'
import { useBilling } from '~/composables/useBilling'

const { user, updateProfile } = useUser()
const { activePlan, triggerUpgradeModal } = useBilling()
const isFreePlan = computed(() => activePlan.value === 'FREE')

// Local state for allergies
const localAllergies = ref<string[]>([])
const isAllergiesSaving = ref(false)

// Local state for diets
const localDiets = ref<string[]>([])
const isDietsSaving = ref(false)

// Synchronize local state with store
const syncRestrictions = () => {
  if (user.value) {
    localAllergies.value = [...(user.value.allergies || [])]
    localDiets.value = [...(user.value.dietary || [])]
  }
}

watch(() => user.value, syncRestrictions, { immediate: true, deep: true })

// Allergies Change detection & handlers
const hasAllergiesChanges = computed(() => {
  const original = user.value?.allergies || []
  if (original.length !== localAllergies.value.length) return true
  const origSet = new Set(original)
  return localAllergies.value.some(a => !origSet.has(a))
})

const resetLocalAllergies = () => {
  localAllergies.value = [...(user.value?.allergies || [])]
}

const saveAllergies = async () => {
  isAllergiesSaving.value = true
  const toast = useToast()
  const res = await updateProfile({
    allergies: localAllergies.value
  })
  isAllergiesSaving.value = false
  if (res.success) {
    toast.add({
      title: 'Алергії оновлено!',
      color: 'success'
    })
  } else {
    toast.add({
      title: 'Помилка збереження',
      description: res.error,
      color: 'error'
    })
  }
}

// Diets Change detection & handlers
const hasDietsChanges = computed(() => {
  const original = user.value?.dietary || []
  if (original.length !== localDiets.value.length) return true
  const origSet = new Set(original)
  return localDiets.value.some(d => !origSet.has(d))
})

const resetLocalDiets = () => {
  localDiets.value = [...(user.value?.dietary || [])]
}

const saveDiets = async () => {
  isDietsSaving.value = true
  const toast = useToast()
  const res = await updateProfile({
    dietary: localDiets.value
  })
  isDietsSaving.value = false
  if (res.success) {
    toast.add({
      title: 'Дієти оновлено!',
      color: 'success'
    })
  } else {
    toast.add({
      title: 'Помилка збереження',
      description: res.error,
      color: 'error'
    })
  }
}
</script>

<template>
  <div
    class="flex w-full"
    :class="isUser ? 'flex-row-reverse' : 'flex-row'"
  >
    <!-- Bubble & content -->
    <div class="flex flex-col gap-2 min-w-0" :class="isUser ? 'max-w-[85%] sm:max-w-[78%] items-end' : 'w-full items-start'">
      <!-- Message bubble -->
      <div
        class="text-[17px] sm:text-[18px] leading-relaxed transition-all duration-200"
        :class="[
          isUser
            ? 'bg-ai-indigo-500 text-white rounded-2xl px-5 py-3 shadow-xs rounded-tr-xs'
            : 'bg-transparent text-smak-neutral-900 dark:text-smak-neutral-100 p-0 w-full max-w-full',
          isStreaming && !isUser ? 'animate-pulse-subtle' : ''
        ]"
      >
        <!-- AI message: render as markdown blocks -->
        <div
          v-if="!isUser"
          class="prose dark:prose-invert max-w-none flex flex-col gap-4 text-[17px] sm:text-[18px]"
        >
          <template v-for="(block, idx) in parsedMessageBlocks" :key="idx">
            <!-- Text -->
            <div v-if="block.type === 'text'" v-html="md.render(block.value)" />

            <div
              v-else-if="block.type === 'recipes'"
              class="my-3 w-full max-w-full"
            >
              <!-- Case 1: More than one resolved recipe -> render slider -->
              <div
                v-if="block.recipes.length > 1"
                class="w-full"
              >
                <ChatRecipeSlider 
                  :recipes="block.recipes" 
                  :animate="isStreaming"
                />
                <div 
                  v-if="block.rawIds.some(id => !getRecipeById(id))" 
                  class="flex flex-wrap gap-1.5 mt-1"
                >
                  <template v-for="recipeId in block.rawIds" :key="recipeId">
                    <span
                      v-if="!getRecipeById(recipeId)"
                      class="inline-flex text-[10px] text-smak-neutral-400 dark:text-smak-neutral-500 italic px-2.5 py-1 border border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-900/50 rounded-lg"
                    >
                      [Рецепт: {{ recipeId }}]
                    </span>
                  </template>
                </div>
              </div>
              
              <!-- Case 2: Exactly one resolved recipe -> render full-width horizontal card -->
              <div v-else-if="block.recipes.length === 1" class="w-full max-w-full my-3">
                <ChatRecipeCard :recipe="block.recipes[0]!" mode="horizontal" :animate="isStreaming" />
                <!-- Placeholders for other unresolved recipes in the group, if any -->
                <div 
                  v-if="block.rawIds.length > 1 && block.rawIds.some(id => !getRecipeById(id))" 
                  class="flex flex-wrap gap-1.5 mt-2"
                >
                  <template v-for="recipeId in block.rawIds" :key="recipeId">
                    <span
                      v-if="!getRecipeById(recipeId)"
                      class="inline-flex text-[10px] text-smak-neutral-400 dark:text-smak-neutral-500 italic px-2.5 py-1 border border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-900/50 rounded-lg"
                    >
                      [Рецепт: {{ recipeId }}]
                    </span>
                  </template>
                </div>
              </div>

              <!-- Case 3: Zero resolved recipes -> render placeholders for all of them -->
              <div v-else class="flex flex-wrap gap-1.5 my-3">
                <span
                  v-for="recipeId in block.rawIds"
                  :key="recipeId"
                  class="inline text-smak-neutral-400 dark:text-smak-neutral-500 italic text-xs"
                >
                  [Рецепт: {{ recipeId }}]
                </span>
              </div>
            </div>

            <!-- Allergies Card (inline) -->
            <div v-else-if="block.type === 'allergies'" class="my-4 w-full relative group/card" :class="{ 'animate-card-appear': isStreaming }">
              <!-- Premium Lock Card for FREE plan -->
              <div
                v-if="isFreePlan"
                class="p-6 sm:p-8 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col items-center text-center space-y-4 my-2 select-none animate-fade-in w-full"
              >
                <div class="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                  <UIcon name="i-lucide-lock" class="w-6 h-6" />
                </div>
                <div class="space-y-1.5 max-w-xl mx-auto">
                  <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white">
                    Персональні алергени та непереносимість
                  </h3>
                  <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                    Автоматичне виключення небажаних алергенів з рецептів та рекомендацій ШІ.
                  </p>
                </div>
                <div class="pt-1">
                  <UButton
                    variant="outline"
                    color="neutral"
                    size="xl"
                    class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-rose-300 hover:text-rose-500 dark:hover:border-rose-700 dark:hover:text-rose-400 transition-smooth cursor-pointer px-8"
                    @click="() => { navigateTo('/billing/plans') }"
                  >
                    Розблокувати
                  </UButton>
                </div>
              </div>

              <!-- Interactive Allergies Selector for PRO/PREMIUM -->
              <div v-else class="relative overflow-hidden rounded-3xl border border-smak-neutral-100 dark:border-smak-neutral-800 bg-white/70 dark:bg-smak-neutral-900/50 backdrop-blur-xl p-5 shadow-lg w-full">
                <div class="space-y-4">
                  <div class="flex items-center gap-2 border-b border-smak-neutral-100 dark:border-smak-neutral-800 pb-2.5">
                    <div class="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                      <UIcon name="i-lucide-shield-alert" class="w-4.5 h-4.5" />
                    </div>
                    <span class="font-heading font-black text-sm text-smak-neutral-800 dark:text-white">Алергії та непереносимість</span>
                  </div>
                  <ProfileAllergiesSelector v-model="localAllergies" />
                  <div v-if="hasAllergiesChanges" class="flex justify-end gap-2 pt-3 border-t border-smak-neutral-100 dark:border-smak-neutral-800 mt-2">
                    <UButton size="sm" variant="ghost" color="neutral" class="rounded-xl font-bold cursor-pointer" :disabled="isAllergiesSaving" @click="resetLocalAllergies">Скасувати</UButton>
                    <UButton size="sm" class="rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer" :loading="isAllergiesSaving" @click="saveAllergies">Зберегти</UButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Diets Card (inline) -->
            <div v-else-if="block.type === 'diets'" class="my-4 w-full relative group/card" :class="{ 'animate-card-appear': isStreaming }">
              <!-- Premium Lock Card for FREE plan -->
              <div
                v-if="isFreePlan"
                class="p-6 sm:p-8 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col items-center text-center space-y-4 my-2 select-none animate-fade-in w-full"
              >
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <UIcon name="i-lucide-lock" class="w-6 h-6" />
                </div>
                <div class="space-y-1.5 max-w-xl mx-auto">
                  <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white">
                    Персональні дієти та стиль харчування
                  </h3>
                  <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                    Адаптація страв, пропорцій та раціону під ваш персональний стиль харчування.
                  </p>
                </div>
                <div class="pt-1">
                  <UButton
                    variant="outline"
                    color="neutral"
                    size="xl"
                    class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-smooth cursor-pointer px-8"
                    @click="() => { navigateTo('/billing/plans') }"
                  >
                    Розблокувати
                  </UButton>
                </div>
              </div>

              <!-- Interactive Diets Selector for PRO/PREMIUM -->
              <div v-else class="relative overflow-hidden rounded-3xl border border-smak-neutral-100 dark:border-smak-neutral-800 bg-white/70 dark:bg-smak-neutral-900/50 backdrop-blur-xl p-5 shadow-lg w-full">
                <div class="space-y-4">
                  <div class="flex items-center gap-2 border-b border-smak-neutral-100 dark:border-smak-neutral-800 pb-2.5">
                    <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <UIcon name="i-lucide-leaf" class="w-4.5 h-4.5" />
                    </div>
                    <span class="font-heading font-black text-sm text-smak-neutral-800 dark:text-white">Дієти та стиль харчування</span>
                  </div>
                  <ProfileDietsSelector v-model="localDiets" />
                  <div v-if="hasDietsChanges" class="flex justify-end gap-2 pt-3 border-t border-smak-neutral-100 dark:border-smak-neutral-800 mt-2">
                    <UButton size="sm" variant="ghost" color="neutral" class="rounded-xl font-bold cursor-pointer" :disabled="isDietsSaving" @click="resetLocalDiets">Скасувати</UButton>
                    <UButton size="sm" class="rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer" :loading="isDietsSaving" @click="saveDiets">Зберегти</UButton>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Fallback: Allergies Card for old messages without [Allergies] placeholder -->
          <div v-if="showFallbackAllergies" class="my-4 w-full relative group/card" :class="{ 'animate-card-appear': isStreaming }">
            <div
              v-if="isFreePlan"
              class="p-6 sm:p-8 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col items-center text-center space-y-4 my-2 select-none animate-fade-in w-full"
            >
              <div class="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <UIcon name="i-lucide-lock" class="w-6 h-6" />
              </div>
              <div class="space-y-1.5 max-w-xl mx-auto">
                <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white">
                  Персональні алергени та непереносимість
                </h3>
                <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                  Автоматичне виключення небажаних алергенів з рецептів та рекомендацій ШІ.
                </p>
              </div>
              <div class="pt-1">
                <UButton
                  variant="outline"
                  color="neutral"
                  size="xl"
                  class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-rose-300 hover:text-rose-500 dark:hover:border-rose-700 dark:hover:text-rose-400 transition-smooth cursor-pointer px-8"
                  @click="() => { navigateTo('/billing/plans') }"
                >
                  Розблокувати
                </UButton>
              </div>
            </div>
            <div v-else class="relative overflow-hidden rounded-3xl border border-smak-neutral-100 dark:border-smak-neutral-800 bg-white/70 dark:bg-smak-neutral-900/50 backdrop-blur-xl p-5 shadow-lg w-full">
              <div class="space-y-4">
                <div class="flex items-center gap-2 border-b border-smak-neutral-100 dark:border-smak-neutral-800 pb-2.5">
                  <div class="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0"><UIcon name="i-lucide-shield-alert" class="w-4.5 h-4.5" /></div>
                  <span class="font-heading font-black text-sm text-smak-neutral-800 dark:text-white">Алергії та непереносимість</span>
                </div>
                <ProfileAllergiesSelector v-model="localAllergies" />
                <div v-if="hasAllergiesChanges" class="flex justify-end gap-2 pt-3 border-t border-smak-neutral-100 dark:border-smak-neutral-800 mt-2">
                  <UButton size="sm" variant="ghost" color="neutral" class="rounded-xl font-bold cursor-pointer" :disabled="isAllergiesSaving" @click="resetLocalAllergies">Скасувати</UButton>
                  <UButton size="sm" class="rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer" :loading="isAllergiesSaving" @click="saveAllergies">Зберегти</UButton>
                </div>
              </div>
            </div>
          </div>

          <!-- Fallback: Diets Card for old messages without [Diets] placeholder -->
          <div v-if="showFallbackDiets" class="my-4 w-full relative group/card" :class="{ 'animate-card-appear': isStreaming }">
            <div
              v-if="isFreePlan"
              class="p-6 sm:p-8 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col items-center text-center space-y-4 my-2 select-none animate-fade-in w-full"
            >
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <UIcon name="i-lucide-lock" class="w-6 h-6" />
              </div>
              <div class="space-y-1.5 max-w-xl mx-auto">
                <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white">
                  Персональні дієти та стиль харчування
                </h3>
                <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                  Адаптація страв, пропорцій та раціону під ваш персональний стиль харчування.
                </p>
              </div>
              <div class="pt-1">
                <UButton
                  variant="outline"
                  color="neutral"
                  size="xl"
                  class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-smooth cursor-pointer px-8"
                  @click="() => { navigateTo('/billing/plans') }"
                >
                  Розблокувати
                </UButton>
              </div>
            </div>
            <div v-else class="relative overflow-hidden rounded-3xl border border-smak-neutral-100 dark:border-smak-neutral-800 bg-white/70 dark:bg-smak-neutral-900/50 backdrop-blur-xl p-5 shadow-lg w-full">
              <div class="space-y-4">
                <div class="flex items-center gap-2 border-b border-smak-neutral-100 dark:border-smak-neutral-800 pb-2.5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><UIcon name="i-lucide-leaf" class="w-4.5 h-4.5" /></div>
                  <span class="font-heading font-black text-sm text-smak-neutral-800 dark:text-white">Дієти та стиль харчування</span>
                </div>
                <ProfileDietsSelector v-model="localDiets" />
                <div v-if="hasDietsChanges" class="flex justify-end gap-2 pt-3 border-t border-smak-neutral-100 dark:border-smak-neutral-800 mt-2">
                  <UButton size="sm" variant="ghost" color="neutral" class="rounded-xl font-bold cursor-pointer" :disabled="isDietsSaving" @click="resetLocalDiets">Скасувати</UButton>
                  <UButton size="sm" class="rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer" :loading="isDietsSaving" @click="saveDiets">Зберегти</UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- User message: plain text -->
        <p v-else class="whitespace-pre-wrap wrap-break-word text-[17px] sm:text-[18px] leading-relaxed">{{ message.content }}</p>

        <!-- Streaming cursor -->
        <span
          v-if="isStreaming && !isUser"
          class="inline-block w-0.5 h-4.5 bg-ai-indigo-500 dark:bg-ai-indigo-400 animate-blink ml-0.5 align-middle"
        />
      </div>

      <!-- Recipe cards in metadata (only unused ones as a fallback/compatibility layer) -->
      <div v-if="unusedRecipes.length > 0 && !isUser" class="flex flex-col gap-2 w-full max-w-full overflow-hidden mt-2">
        <p class="text-xs font-semibold text-smak-neutral-400 dark:text-smak-neutral-500 px-1">
          Рекомендовані рецепти:
        </p>
        <div v-if="unusedRecipes.length === 1" class="w-full">
          <ChatRecipeCard :recipe="unusedRecipes[0]!" mode="horizontal" :animate="isStreaming" />
        </div>
        <ChatRecipeSlider v-else :recipes="unusedRecipes" :animate="isStreaming" />
      </div>

      <!-- Timestamp -->
      <span class="text-[11px] text-smak-neutral-400 dark:text-smak-neutral-500 px-1">
        {{ formattedTime }}
      </span>
    </div>
  </div>
</template>

<style scoped>
:deep(.prose) {
  font-size: 1.0625rem; /* 17px */
}
@media (min-width: 640px) {
  :deep(.prose) {
    font-size: 1.125rem; /* 18px */
  }
}
:deep(.prose p) {
  margin-bottom: 1rem;
  line-height: 1.8;
  font-size: 1.0625rem; /* 17px */
}
@media (min-width: 640px) {
  :deep(.prose p) {
    font-size: 1.125rem; /* 18px */
    line-height: 1.8;
  }
}
:deep(.prose p:last-child) {
  margin-bottom: 0;
}
:deep(.prose br) {
  display: block;
  content: "";
  margin-top: 0.5rem;
}
:deep(.prose h1), :deep(.prose h2), :deep(.prose h3), :deep(.prose h4) {
  font-weight: 700;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  color: var(--color-smak-neutral-950);
  font-family: var(--font-heading);
  line-height: 1.3;
}
.dark :deep(.prose h1), .dark :deep(.prose h2), .dark :deep(.prose h3), .dark :deep(.prose h4) {
  color: #ffffff;
}
:deep(.prose h1) { font-size: 1.75rem; }
:deep(.prose h2) { font-size: 1.5rem; }
:deep(.prose h3) { font-size: 1.3rem; }
:deep(.prose h4) { font-size: 1.15rem; }

/* Lists formatting (Tailwind reset fix) */
:deep(.prose ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}
:deep(.prose ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}
:deep(.prose li) {
  margin-bottom: 0.5rem;
  line-height: 1.75;
  font-size: 1.0625rem;
}
@media (min-width: 640px) {
  :deep(.prose li) {
    font-size: 1.125rem;
  }
}
:deep(.prose li p) {
  margin-bottom: 0;
}

/* Blockquotes */
:deep(.prose blockquote) {
  border-left: 4px solid var(--color-ai-indigo-500);
  padding-left: 1.125rem;
  font-style: italic;
  font-size: 1.0625rem;
  color: var(--color-smak-neutral-500);
  margin-top: 1rem;
  margin-bottom: 1rem;
}
@media (min-width: 640px) {
  :deep(.prose blockquote) {
    font-size: 1.125rem;
  }
}

/* Tables formatting */
:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  font-size: 0.9375rem;
}
:deep(.prose th), :deep(.prose td) {
  border: 1px solid var(--color-smak-neutral-200);
  padding: 0.625rem 0.875rem;
  text-align: left;
}
.dark :deep(.prose th), .dark :deep(.prose td) {
  border-color: var(--color-smak-neutral-800);
}
:deep(.prose th) {
  background-color: var(--color-smak-neutral-100)/50;
  font-weight: 700;
}
.dark :deep(.prose th) {
  background-color: var(--color-smak-neutral-900)/50;
}

/* Links */
:deep(.prose a) {
  color: var(--color-ai-indigo-500);
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s;
}
:deep(.prose a:hover) {
  color: var(--color-ai-indigo-600);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.animate-blink {
  animation: blink 1s step-start infinite;
}
.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
</style>
