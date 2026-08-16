<script setup lang="ts">
import { translateCuisine, translateTaste, getActiveDiets } from '~/utils/formatters'

const props = defineProps<{
  recipe: any
}>()

const activeDiets = computed(() => getActiveDiets(props.recipe))
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
    <div class="lg:col-span-7 space-y-6">

      <!-- 3 Characteristic Groups arranged vertically one under another -->
      <div class="flex flex-col gap-6 sm:gap-8 items-start w-full">
        
        <!-- GROUP 1: Cuisine origin -->
        <div class="w-full flex flex-col space-y-3">
          <span class="text-[10px] uppercase font-black tracking-widest text-smak-neutral-400 flex items-center gap-1.5">
            <UIcon name="i-lucide-globe" class="w-4 h-4 text-coral-500" />
            <span>Походження</span>
          </span>
          <div v-if="recipe.cuisineList && recipe.cuisineList.length > 0" class="flex flex-wrap gap-2">
            <span 
              v-for="cuisine in recipe.cuisineList" 
              :key="cuisine"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-coral-100 dark:bg-coral-500/10 text-coral-800 dark:text-coral-400 text-xs font-black rounded-xl border border-coral-200 dark:border-coral-500/20 shadow-2xs backdrop-blur-sm"
            >
              <span>🌍</span>
              <span>{{ translateCuisine(cuisine) }} кухня</span>
            </span>
          </div>
          <div v-else class="text-xs font-semibold text-smak-neutral-400 italic">
            Міжнародна кухня
          </div>
        </div>

        <!-- GROUP 2: Tastes profile -->
        <div class="w-full flex flex-col space-y-3">
          <span class="text-[10px] uppercase font-black tracking-widest text-smak-neutral-400 flex items-center gap-1.5">
            <UIcon name="i-lucide-utensils" class="w-4 h-4 text-orange-500" />
            <span>Смакова палітра</span>
          </span>
          <div v-if="recipe.tastes && recipe.tastes.length > 0" class="flex flex-wrap gap-1.5">
            <span 
              v-for="taste in recipe.tastes" 
              :key="taste"
              class="inline-flex items-center gap-1 px-3.5 py-1.5 bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 text-xs font-black rounded-xl border border-orange-200 dark:border-orange-500/20 shadow-2xs backdrop-blur-sm"
            >
              <span>👅</span>
              <span>{{ translateTaste(taste) }}</span>
            </span>
          </div>
          <div v-else class="text-xs font-semibold text-smak-neutral-400 italic">
            Баланс смаків
          </div>
        </div>

        <!-- GROUP 3: Diet / Characteristics -->
        <div class="w-full flex flex-col space-y-3">
          <span class="text-[10px] uppercase font-black tracking-widest text-smak-neutral-400 flex items-center gap-1.5">
            <UIcon name="i-lucide-leaf" class="w-4 h-4 text-emerald-500" />
            <span>Особливості меню</span>
          </span>
          <div v-if="activeDiets.length > 0" class="flex flex-wrap gap-1.5">
            <span 
              v-for="diet in activeDiets" 
              :key="diet.key"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-xl border shadow-2xs bg-smak-neutral-50 dark:bg-smak-neutral-800/40 text-smak-neutral-900 dark:text-smak-neutral-200 border-smak-neutral-200 dark:border-smak-neutral-700/50 backdrop-blur-sm"
            >
              {{ diet.icon }} {{ diet.label }}
            </span>
          </div>
          <div v-else class="text-xs font-semibold text-smak-neutral-400 italic">
            Стандартне домашнє меню
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
