<script setup lang="ts">
import type { ChatMessageRecipeRef } from '~/types/chat'
import { useCloudinary } from '~/composables/useCloudinary'
import { translateCategory } from '~/utils/formatters'

interface Props {
  recipe: ChatMessageRecipeRef
  animate?: boolean
  mode?: 'vertical' | 'horizontal'
}

const props = withDefaults(defineProps<Props>(), {
  animate: false,
  mode: 'vertical',
})

const { getUrl } = useCloudinary()

const coverUrl = computed(() => {
  if (!props.recipe.coverImageId) return null
  if (props.recipe.coverImageId.startsWith('http')) return props.recipe.coverImageId
  return getUrl(props.recipe.coverImageId, { width: 700, height: 450, crop: 'fill' })
})

const difficultyLabel: Record<string, string> = {
  easy: 'Легко',
  medium: 'Сер.',
  hard: 'Скл.',
}

const difficultyColor: Record<string, string> = {
  easy: 'text-emerald-700 bg-emerald-50/95 dark:text-emerald-300 dark:bg-emerald-950/80 border border-emerald-200/60 dark:border-emerald-800/50',
  medium: 'text-amber-700 bg-amber-50/95 dark:text-amber-300 dark:bg-amber-950/80 border border-amber-200/60 dark:border-amber-800/50',
  hard: 'text-rose-700 bg-rose-50/95 dark:text-rose-300 dark:bg-rose-950/80 border border-rose-200/60 dark:border-rose-800/50',
}
</script>

<template>
  <NuxtLink
    :to="`/recipes/${recipe.id}`"
    class="group block rounded-3xl border border-smak-neutral-200/80 dark:border-smak-neutral-800 bg-white dark:bg-smak-neutral-900/90 backdrop-blur-md hover:border-coral-400/60 dark:hover:border-coral-400/40 hover:shadow-xl hover:shadow-coral-500/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden relative no-underline cursor-pointer select-none"
    :class="[
      mode === 'horizontal' ? 'w-full p-4 sm:p-6 min-h-55 sm:min-h-60' : 'shrink-0 p-3 sm:p-3.5 flex flex-col',
      { 'animate-card-appear': animate }
    ]"
  >
    <div :class="mode === 'horizontal' ? 'flex flex-col sm:flex-row gap-5 sm:gap-6 items-stretch' : 'flex flex-col gap-2.5 flex-1'">
      <!-- Top / Main content: Image and Title -->
      <div :class="mode === 'horizontal' ? 'flex flex-col sm:flex-row gap-5 sm:gap-6 flex-1 min-w-0 items-stretch' : 'flex flex-col gap-2.5'">
        <!-- Cover image wrapper with top-left badges -->
        <div 
          class="relative rounded-2xl overflow-hidden bg-smak-neutral-100 dark:bg-smak-neutral-800 shadow-2xs shrink-0 border border-smak-neutral-100/60 dark:border-smak-neutral-800/40"
          :class="mode === 'horizontal' ? 'w-full aspect-16/10 sm:aspect-auto sm:w-72 md:w-80 lg:w-96 sm:min-h-50 md:min-h-55' : 'w-full aspect-16/10'"
        >
          <img
            v-if="coverUrl"
            :src="coverUrl"
            :alt="recipe.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-linear-to-br from-coral-500/5 to-orange-500/10 text-coral-400">
            <UIcon name="i-lucide-chef-hat" class="w-8 h-8 animate-pulse-subtle" />
          </div>

          <!-- Top-Left Badges (Cook Time, Difficulty, Rating) -->
          <div class="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-16px)]">
            <!-- Cook time badge -->
            <div 
              v-if="recipe.cookTime" 
              class="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/95 dark:bg-smak-neutral-900/90 text-smak-neutral-800 dark:text-smak-neutral-200 shadow-xs backdrop-blur-xs border border-smak-neutral-200/50 dark:border-smak-neutral-700/50"
            >
              <UIcon name="i-lucide-clock" class="w-3 h-3 text-coral-500 shrink-0" />
              <span>{{ recipe.cookTime }} хв</span>
            </div>

            <!-- Difficulty badge -->
            <div 
              v-if="recipe.difficulty" 
              class="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-xs"
              :class="difficultyColor[recipe.difficulty]"
            >
              <UIcon name="i-lucide-gauge" class="w-3 h-3 shrink-0" />
              <span>{{ difficultyLabel[recipe.difficulty] }}</span>
            </div>

            <!-- Rating badge -->
            <div 
              v-if="recipe.rating" 
              class="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold text-white shadow-xs"
            >
              <UIcon name="i-lucide-star" class="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
              {{ recipe.rating.toFixed(1) }}
            </div>
          </div>
        </div>

        <!-- Horizontal Mode Info layout -->
        <div v-if="mode === 'horizontal'" class="flex-1 flex flex-col justify-center min-w-0 py-1 sm:py-2 gap-2 sm:gap-2.5">
          <!-- Category -->
          <span 
            v-if="recipe.category" 
            class="text-[10px] sm:text-xs font-black tracking-widest uppercase text-coral-500 dark:text-coral-400 block font-heading"
          >
            {{ translateCategory(recipe.category) }}
          </span>
          <!-- Title -->
          <h3 class="font-heading font-black text-lg sm:text-xl md:text-2xl text-smak-neutral-900 dark:text-white line-clamp-2 leading-snug group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors">
            {{ recipe.title }}
          </h3>
          <!-- Description -->
          <p 
            v-if="recipe.description" 
            class="text-xs sm:text-sm md:text-base font-medium text-smak-neutral-600 dark:text-smak-neutral-300 line-clamp-3 sm:line-clamp-4 leading-relaxed"
          >
            {{ recipe.description }}
          </p>
        </div>

        <!-- Vertical Mode Info layout -->
        <div v-else class="flex flex-col min-w-0 space-y-1 px-0.5 pt-0.5">
          <!-- Category -->
          <span 
            v-if="recipe.category" 
            class="text-[9px] sm:text-[10px] font-black tracking-wider uppercase text-coral-500 dark:text-coral-400 block font-heading truncate"
          >
            {{ translateCategory(recipe.category) }}
          </span>
          <!-- Title -->
          <h3 class="font-heading font-black text-sm sm:text-base text-smak-neutral-900 dark:text-white line-clamp-2 leading-snug group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors duration-200">
            {{ recipe.title }}
          </h3>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
a {
  text-decoration: none !important;
}
</style>
