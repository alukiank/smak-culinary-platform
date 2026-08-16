<script setup lang="ts">
import type { ChatMessageRecipeRef } from '~/types/chat'
import { useCloudinary } from '~/composables/useCloudinary'

interface Props {
  recipe: ChatMessageRecipeRef
  animate?: boolean
  mode?: 'vertical' | 'horizontal'
}

const props = withDefaults(defineProps<Props>(), {
  animate: false,
  mode: 'vertical',
})
const router = useRouter()

const { getUrl } = useCloudinary()

const coverUrl = computed(() => {
  if (!props.recipe.coverImageId) return null
  if (props.recipe.coverImageId.startsWith('http')) return props.recipe.coverImageId
  return getUrl(props.recipe.coverImageId, { width: 450, height: 300, crop: 'fill' })
})

const difficultyLabel: Record<string, string> = {
  easy: 'Легко',
  medium: 'Сер.',
  hard: 'Скл.',
}

const difficultyColor: Record<string, string> = {
  easy: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10',
  medium: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-400/10',
  hard: 'text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-400/10',
}

const handleCookClick = (e: Event) => {
  e.stopPropagation()
  e.preventDefault()
  router.push(`/recipes/${props.recipe.id}`)
}
</script>

<template>
  <NuxtLink
    :to="`/recipes/${recipe.id}`"
    class="group block rounded-3xl border border-smak-neutral-200/60 dark:border-smak-neutral-800/80 bg-white/90 dark:bg-smak-neutral-900/90 backdrop-blur-md hover:border-coral-400/40 dark:hover:border-coral-400/30 hover:shadow-xl hover:shadow-coral-500/5 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 overflow-hidden relative no-underline"
    :class="[
      mode === 'horizontal' ? 'w-full p-4 sm:p-5' : 'w-[200px] shrink-0 p-3 flex flex-col min-h-[270px]',
      { 'animate-card-appear': animate }
    ]"
  >
    <div :class="mode === 'horizontal' ? 'flex flex-col sm:flex-row gap-4 sm:gap-5' : 'flex flex-col gap-2.5 flex-1'">
      <!-- Cover image wrapper -->
      <div 
        class="relative rounded-2xl overflow-hidden bg-smak-neutral-100 dark:bg-smak-neutral-800 shadow-xs shrink-0 border border-smak-neutral-100/50 dark:border-smak-neutral-800/30"
        :class="mode === 'horizontal' ? 'w-full h-44 sm:w-44 sm:h-auto sm:self-stretch' : 'w-full h-28'"
      >
        <img
          v-if="coverUrl"
          :src="coverUrl"
          :alt="recipe.title"
          class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-linear-to-br from-coral-500/5 to-orange-500/10 text-coral-400">
          <UIcon name="i-lucide-chef-hat" class="w-8 h-8 animate-pulse-subtle" />
        </div>

        <!-- Overlays inside image -->
        <!-- Rating badge (top-left) -->
        <div 
          v-if="recipe.rating" 
          class="absolute top-2.5 left-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs"
        >
          <UIcon name="i-lucide-star" class="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
          {{ recipe.rating.toFixed(1) }}
        </div>

      </div>

      <!-- Horizontal Mode Info layout -->
      <div v-if="mode === 'horizontal'" class="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div class="space-y-1">
          <!-- Category -->
          <span 
            v-if="recipe.category" 
            class="text-[9px] font-black tracking-widest uppercase text-coral-500 dark:text-coral-400 block font-heading"
          >
            {{ recipe.category }}
          </span>
          <!-- Title -->
          <h3 class="font-heading font-black text-base sm:text-lg text-smak-neutral-900 dark:text-white line-clamp-1 leading-snug group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors">
            {{ recipe.title }}
          </h3>
          <!-- Description -->
          <p 
            v-if="recipe.description" 
            class="text-xs font-semibold text-smak-neutral-500 dark:text-smak-neutral-400 line-clamp-2 mt-1 leading-relaxed"
          >
            {{ recipe.description }}
          </p>
        </div>

        <!-- Stats & Action row -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-smak-neutral-100 dark:border-smak-neutral-800/80">
          <div class="flex items-center gap-2">
            <!-- Cook time -->
            <div v-if="recipe.cookTime" class="flex items-center gap-1 text-[10px] text-smak-neutral-500 dark:text-smak-neutral-400 font-bold bg-smak-neutral-100 dark:bg-smak-neutral-800/60 px-2 py-0.5 rounded-md">
              <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-coral-500 shrink-0" />
              <span>{{ recipe.cookTime }} хв</span>
            </div>
            <!-- Difficulty (text fallback badge) -->
            <div 
              v-if="recipe.difficulty" 
              class="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
              :class="difficultyColor[recipe.difficulty]"
            >
              <UIcon name="i-lucide-gauge" class="w-3.5 h-3.5 shrink-0" />
              <span>{{ difficultyLabel[recipe.difficulty] }}</span>
            </div>
          </div>

          <button
            type="button"
            class="py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider bg-coral-500 hover:bg-coral-600 text-white shadow-xs hover:shadow-md hover:shadow-coral-500/10 active:scale-[0.97] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 border-0"
            @click="handleCookClick"
          >
            <UIcon name="i-lucide-cooking-pot" class="w-3.5 h-3.5" />
            Приготувати
          </button>
        </div>
      </div>

      <!-- Vertical Mode Info layout -->
      <div v-else class="flex-1 flex flex-col min-w-0">
        <div class="space-y-1">
          <!-- Category -->
          <span 
            v-if="recipe.category" 
            class="text-[8px] font-black tracking-wider uppercase text-coral-500 dark:text-coral-400 block font-heading"
          >
            {{ recipe.category }}
          </span>
          <!-- Title -->
          <h3 class="font-bold text-xs text-smak-neutral-800 dark:text-white line-clamp-2 leading-snug group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors duration-200 min-h-[32px]">
            {{ recipe.title }}
          </h3>
        </div>

        <div class="flex flex-wrap items-center gap-1.5 mt-2 mb-3">
          <!-- Cook time -->
          <div v-if="recipe.cookTime" class="flex items-center gap-1 text-[9px] text-smak-neutral-500 dark:text-smak-neutral-400 font-bold bg-smak-neutral-100 dark:bg-smak-neutral-800/80 px-1.5 py-0.5 rounded-md shrink-0">
            <UIcon name="i-lucide-clock" class="w-3 h-3 text-coral-500 shrink-0" />
            <span>{{ recipe.cookTime }} хв</span>
          </div>
          <!-- Difficulty badge next to time -->
          <div 
            v-if="recipe.difficulty" 
            class="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
            :class="difficultyColor[recipe.difficulty]"
          >
            <UIcon name="i-lucide-gauge" class="w-3 h-3 shrink-0" />
            <span>{{ difficultyLabel[recipe.difficulty] }}</span>
          </div>
        </div>

        <!-- Quick CTA -->
        <div class="mt-auto pt-3.5 border-t border-smak-neutral-100 dark:border-smak-neutral-800/80 flex gap-1.5 w-full">
          <button
            type="button"
            class="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-coral-500 hover:bg-coral-600 text-white shadow-xs hover:shadow-md hover:shadow-coral-500/10 active:scale-[0.97] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 border-0"
            @click="handleCookClick"
          >
            <UIcon name="i-lucide-cooking-pot" class="w-3.5 h-3.5" />
            Приготувати
          </button>
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
