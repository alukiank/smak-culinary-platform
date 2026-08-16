<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { categoryTranslations, cuisineTranslations } from '~/utils/formatters'

// Define the filter interface matching what can be passed to our API
export interface RecipeFilters {
  category?: string
  cuisineList?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  cookSpeed?: 'fast' | 'medium' | 'slow'
  maxCookTime?: number
  minHealthScore?: number
  minRating?: number
  isVegetarian?: boolean
  isVegan?: boolean
  isGluten_free?: boolean
  isHalal?: boolean
  isKosher?: boolean
  isDairyFree?: boolean
  isNutFree?: boolean
}

const props = defineProps<{
  modelValue: RecipeFilters
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RecipeFilters): void
  (e: 'apply', value: RecipeFilters): void
  (e: 'clear', value: RecipeFilters): void
}>()

// Local state for filters to avoid premature queries while the user is interacting
const localFilters = ref<RecipeFilters>({
  ...props.modelValue,
  maxCookTime: props.modelValue.maxCookTime !== undefined ? props.modelValue.maxCookTime : 180,
  minHealthScore: props.modelValue.minHealthScore !== undefined ? props.modelValue.minHealthScore : 0
})

// Sync local filters with model value changes from outside
watch(() => props.modelValue, (newVal) => {
  localFilters.value = {
    ...newVal,
    maxCookTime: newVal.maxCookTime !== undefined ? newVal.maxCookTime : 180,
    minHealthScore: newVal.minHealthScore !== undefined ? newVal.minHealthScore : 0
  }
}, { deep: true })

// Categories options list
const categoryOptions = [
  { value: '', label: 'Всі категорії' },
  ...Object.entries(categoryTranslations).map(([value, label]) => ({
    value,
    label
  }))
]

// Cuisines options list (for multi-select)
const cuisineOptions = Object.entries(cuisineTranslations).map(([value, label]) => ({
  value,
  label
}))

// Computed properties to adapt primitive string models to Nuxt UI object selects type-safely
const categorySelected = computed({
  get() {
    const val = localFilters.value.category
    if (!val) return categoryOptions[0]
    return categoryOptions.find(opt => opt.value === val) || categoryOptions[0]
  },
  set(newVal) {
    localFilters.value.category = newVal?.value || undefined
  }
})

const cuisinesSelected = computed({
  get() {
    const list = localFilters.value.cuisineList || []
    return cuisineOptions.filter(opt => list.includes(opt.value))
  },
  set(newVal) {
    localFilters.value.cuisineList = newVal ? newVal.map(opt => opt.value) : []
  }
})

// Segmented difficulty choices
const difficultyChoices = [
  { value: 'easy', label: 'Легко', color: 'emerald' },
  { value: 'medium', label: 'Середньо', color: 'amber' },
  { value: 'hard', label: 'Складно', color: 'red' }
]

// Segmented cook speed choices
const cookSpeedChoices = [
  { value: 'fast', label: 'Швидко' },
  { value: 'medium', label: 'Помірно' },
  { value: 'slow', label: 'Повільно' }
]

const toggleDifficulty = (value: 'easy' | 'medium' | 'hard') => {
  if (localFilters.value.difficulty === value) {
    localFilters.value.difficulty = undefined
  } else {
    localFilters.value.difficulty = value
  }
}

const toggleCookSpeed = (value: 'fast' | 'medium' | 'slow') => {
  if (localFilters.value.cookSpeed === value) {
    localFilters.value.cookSpeed = undefined
  } else {
    localFilters.value.cookSpeed = value
  }
}

const applyFilters = () => {
  const updated = { ...localFilters.value }
  emit('update:modelValue', updated)
  emit('apply', updated)
}

const clearFilters = () => {
  const cleared: RecipeFilters = {
    category: undefined,
    cuisineList: [],
    difficulty: undefined,
    cookSpeed: undefined,
    maxCookTime: 180,
    minHealthScore: 0,
    minRating: undefined,
    isVegetarian: false,
    isVegan: false,
    isGluten_free: false,
    isHalal: false,
    isKosher: false,
    isDairyFree: false,
    isNutFree: false
  }
  localFilters.value = cleared
  emit('update:modelValue', cleared)
  emit('clear', cleared)
}

// Count active filters for visual feedback
const activeFiltersCount = computed(() => {
  let count = 0
  const f = localFilters.value
  if (f.category) count++
  if (f.cuisineList && f.cuisineList.length > 0) count++
  if (f.difficulty) count++
  if (f.cookSpeed) count++
  if (f.maxCookTime && f.maxCookTime < 180) count++
  if (f.minHealthScore && f.minHealthScore > 0) count++
  if (f.minRating && f.minRating > 0) count++
  if (f.isVegetarian) count++
  if (f.isVegan) count++
  if (f.isGluten_free) count++
  if (f.isHalal) count++
  if (f.isKosher) count++
  if (f.isDairyFree) count++
  if (f.isNutFree) count++
  return count
})
</script>

<template>
  <div class="flex flex-col bg-transparent text-left relative gap-6 select-none w-full">
    
    <!-- 12-Column Horizontal Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
      
      <!-- Left part: Parameters (Col-span-9 on large screens) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:col-span-9">
        
        <!-- Column 1: Category & Difficulty -->
        <div class="flex flex-col gap-6">
          <!-- Category Filter -->
          <div class="flex flex-col gap-2">
            <label class="text-[11px] font-extrabold text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-lucide-folder" class="w-4 h-4 text-smak-neutral-900 dark:text-white shrink-0" />
              Категорія страви
            </label>
            <USelectMenu
              v-model="categorySelected"
              :items="categoryOptions"
              option-attribute="label"
              placeholder="Виберіть категорію"
              class="w-full rounded-full"
              size="lg"
              :ui="{ base: 'rounded-full' }"
            />
          </div>

          <!-- Difficulty Filter -->
          <div class="flex flex-col gap-2">
            <label class="text-[11px] font-extrabold text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-lucide-gauge" class="w-4 h-4 text-smak-neutral-900 dark:text-white shrink-0" />
              Складність
            </label>
            <div class="bg-smak-neutral-50 dark:bg-smak-neutral-900/50 p-1.5 rounded-full flex gap-1 border border-smak-neutral-100/70 dark:border-smak-neutral-800/40 w-full shrink-0">
              <button
                v-for="choice in difficultyChoices"
                :key="choice.value"
                type="button"
                @click="toggleDifficulty(choice.value as any)"
                class="flex-1 py-2 px-1 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 focus:outline-none flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                :class="[
                  localFilters.difficulty === choice.value
                    ? 'bg-coral-500/10 text-coral-600 dark:text-coral-400 border border-coral-500/20 shadow-xs'
                    : 'border border-transparent bg-transparent text-smak-neutral-500 dark:text-smak-neutral-400 hover:text-smak-neutral-800 dark:hover:text-white'
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-coral-500 shrink-0"></span>
                <span>{{ choice.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Column 2: Cuisine & Cooking Speed -->
        <div class="flex flex-col gap-6">
          <!-- Cuisine Filter -->
          <div class="flex flex-col gap-2">
            <label class="text-[11px] font-extrabold text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-lucide-globe" class="w-4 h-4 text-smak-neutral-900 dark:text-white shrink-0" />
              Кухня світу
            </label>
            <USelectMenu
              v-model="cuisinesSelected"
              :items="cuisineOptions"
              multiple
              option-attribute="label"
              placeholder="Виберіть кухні"
              class="w-full rounded-full"
              size="lg"
              :ui="{ base: 'rounded-full' }"
            />
          </div>

          <!-- Cook Speed Filter -->
          <div class="flex flex-col gap-2">
            <label class="text-[11px] font-extrabold text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-lucide-zap" class="w-4 h-4 text-smak-neutral-900 dark:text-white shrink-0" />
              Швидкість приготування
            </label>
            <div class="bg-smak-neutral-50 dark:bg-smak-neutral-900/50 p-1.5 rounded-full flex gap-1 border border-smak-neutral-100/70 dark:border-smak-neutral-800/40 w-full shrink-0">
              <button
                v-for="choice in cookSpeedChoices"
                :key="choice.value"
                type="button"
                @click="toggleCookSpeed(choice.value as any)"
                class="flex-1 py-2 px-1 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 focus:outline-none flex items-center justify-center cursor-pointer whitespace-nowrap"
                :class="[
                  localFilters.cookSpeed === choice.value
                    ? 'bg-coral-500/10 text-coral-600 dark:text-coral-400 border border-coral-500/20 shadow-xs'
                    : 'border border-transparent bg-transparent text-smak-neutral-500 dark:text-smak-neutral-400 hover:text-smak-neutral-800 dark:hover:text-white'
                ]"
              >
                {{ choice.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Column 3: Rating Stars & Sliders -->
        <div class="flex flex-col gap-5">
          <!-- Min Rating Stars Filter -->
          <div class="flex flex-col gap-2">
            <label class="text-[11px] font-extrabold text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-lucide-star" class="w-4 h-4 text-smak-neutral-900 dark:text-white" />
              Мінімальний рейтинг
            </label>
            <div class="flex gap-2">
              <button
                v-for="ratingVal in [3, 4, 4.5]"
                :key="ratingVal"
                type="button"
                @click="localFilters.minRating = localFilters.minRating === ratingVal ? undefined : ratingVal"
                class="flex-1 py-2 px-1.5 rounded-full border text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 focus:outline-none cursor-pointer whitespace-nowrap"
                :class="[
                  localFilters.minRating === ratingVal
                    ? 'bg-coral-500/10 text-coral-600 dark:text-coral-400 border-coral-500/40 shadow-xs'
                    : 'bg-white dark:bg-smak-neutral-800 text-smak-neutral-500 dark:text-smak-neutral-400 border-smak-neutral-200 dark:border-smak-neutral-700 hover:border-smak-neutral-300 dark:hover:border-smak-neutral-600'
                ]"
              >
                <UIcon name="i-lucide-star" class="w-3.5 h-3.5 text-smak-neutral-900 dark:text-white fill-smak-neutral-900 dark:fill-white shrink-0" />
                <span>{{ ratingVal }}+</span>
              </button>
            </div>
          </div>

          <!-- Sliders Stack -->
          <div class="flex flex-col gap-3.5">
            <!-- Max Cooking Time Slider Group -->
            <div class="bg-smak-neutral-50/50 dark:bg-smak-neutral-900/30 p-3.5 rounded-3xl border border-smak-neutral-100/60 dark:border-smak-neutral-800/40 space-y-2.5 w-full">
              <div class="flex justify-between items-center text-xs">
                <span class="text-[11px] font-extrabold text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <UIcon name="i-lucide-clock" class="w-4 h-4 text-smak-neutral-900 dark:text-white" />
                  Макс. час
                </span>
                <span class="font-bold text-coral-500 dark:text-coral-400 bg-coral-50 dark:bg-coral-950/30 px-2 py-0.5 rounded-full text-xs shrink-0 whitespace-nowrap">
                  {{ localFilters.maxCookTime && localFilters.maxCookTime < 180 ? `${localFilters.maxCookTime} хв` : 'Будь-який' }}
                </span>
              </div>
              <USlider
                v-model="localFilters.maxCookTime"
                :min="5"
                :max="180"
                :step="5"
                class="w-full text-coral-500"
              />
              <div class="flex justify-between text-[10px] text-smak-neutral-400 font-bold px-0.5">
                <span>5 хв</span>
                <span>90 хв</span>
                <span>180+ хв</span>
              </div>
            </div>

            <!-- Min Health Score Slider Group -->
            <div class="bg-smak-neutral-50/50 dark:bg-smak-neutral-900/30 p-3.5 rounded-3xl border border-smak-neutral-100/60 dark:border-smak-neutral-800/40 space-y-2.5 w-full">
              <div class="flex justify-between items-center text-xs">
                <span class="text-[11px] font-extrabold text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <UIcon name="i-lucide-heart-pulse" class="w-4 h-4 text-smak-neutral-900 dark:text-white" />
                  Індекс здоров'я
                </span>
                <span class="font-bold text-coral-500 bg-coral-50 dark:bg-coral-950/30 px-2 py-0.5 rounded-full text-xs shrink-0 whitespace-nowrap">
                  {{ localFilters.minHealthScore ? `≥ ${localFilters.minHealthScore}%` : 'Будь-який' }}
                </span>
              </div>
              <USlider
                v-model="localFilters.minHealthScore"
                :min="0"
                :max="100"
                :step="5"
                class="w-full text-coral-500"
              />
              <div class="flex justify-between text-[10px] text-smak-neutral-400 font-bold px-0.5">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Right side: Dietary Switches (Col-span-3 on large screens) -->
      <div class="flex flex-col gap-2 lg:col-span-3 h-full justify-start">
        <label class="text-[11px] font-extrabold text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
          <UIcon name="i-lucide-leaf" class="w-4 h-4 text-smak-neutral-900 dark:text-white" />
          Особливості харчування
        </label>
        
        <div class="bg-smak-neutral-50/50 dark:bg-smak-neutral-900/30 rounded-3xl border border-smak-neutral-100/60 dark:border-smak-neutral-800/40 divide-y divide-smak-neutral-100/60 dark:divide-smak-neutral-800/40 overflow-hidden flex flex-col justify-between p-1.5">
          
          <!-- Vegan -->
          <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800/30 transition-colors">
            <span class="text-xs sm:text-sm text-smak-neutral-700 dark:text-smak-neutral-300 font-bold flex items-center gap-2">
              <UIcon name="i-lucide-leaf" class="w-4.5 h-4.5 text-smak-neutral-900 dark:text-white shrink-0" />
              Веганський
            </span>
            <USwitch v-model="localFilters.isVegan" size="md" class="shrink-0 cursor-pointer" :ui="{ base: 'data-[state=checked]:bg-coral-500 data-[state=unchecked]:bg-smak-neutral-200 dark:data-[state=unchecked]:bg-smak-neutral-700' }" />
          </div>

          <!-- Vegetarian -->
          <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800/30 transition-colors">
            <span class="text-xs sm:text-sm text-smak-neutral-700 dark:text-smak-neutral-300 font-bold flex items-center gap-2">
              <UIcon name="i-lucide-egg" class="w-4.5 h-4.5 text-smak-neutral-900 dark:text-white shrink-0" />
              Вегетаріанський
            </span>
            <USwitch v-model="localFilters.isVegetarian" size="md" class="shrink-0 cursor-pointer" :ui="{ base: 'data-[state=checked]:bg-coral-500 data-[state=unchecked]:bg-smak-neutral-200 dark:data-[state=unchecked]:bg-smak-neutral-700' }" />
          </div>

          <!-- Gluten Free -->
          <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800/30 transition-colors">
            <span class="text-xs sm:text-sm text-smak-neutral-700 dark:text-smak-neutral-300 font-bold flex items-center gap-2">
              <UIcon name="i-lucide-wheat-off" class="w-4.5 h-4.5 text-smak-neutral-900 dark:text-white shrink-0" />
              Без глютену
            </span>
            <USwitch v-model="localFilters.isGluten_free" size="md" class="shrink-0 cursor-pointer" :ui="{ base: 'data-[state=checked]:bg-coral-500 data-[state=unchecked]:bg-smak-neutral-200 dark:data-[state=unchecked]:bg-smak-neutral-700' }" />
          </div>

          <!-- Dairy Free -->
          <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800/30 transition-colors">
            <span class="text-xs sm:text-sm text-smak-neutral-700 dark:text-smak-neutral-300 font-bold flex items-center gap-2">
              <UIcon name="i-lucide-milk-off" class="w-4.5 h-4.5 text-smak-neutral-900 dark:text-white shrink-0" />
              Без лактози
            </span>
            <USwitch v-model="localFilters.isDairyFree" size="md" class="shrink-0 cursor-pointer" :ui="{ base: 'data-[state=checked]:bg-coral-500 data-[state=unchecked]:bg-smak-neutral-200 dark:data-[state=unchecked]:bg-smak-neutral-700' }" />
          </div>

          <!-- Nut Free -->
          <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800/30 transition-colors">
            <span class="text-xs sm:text-sm text-smak-neutral-700 dark:text-smak-neutral-300 font-bold flex items-center gap-2">
              <UIcon name="i-lucide-ban" class="w-4.5 h-4.5 text-smak-neutral-900 dark:text-white shrink-0" />
              Без горіхів
            </span>
            <USwitch v-model="localFilters.isNutFree" size="md" class="shrink-0 cursor-pointer" :ui="{ base: 'data-[state=checked]:bg-coral-500 data-[state=unchecked]:bg-smak-neutral-200 dark:data-[state=unchecked]:bg-smak-neutral-700' }" />
          </div>

          <!-- Halal -->
          <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800/30 transition-colors">
            <span class="text-xs sm:text-sm text-smak-neutral-700 dark:text-smak-neutral-300 font-bold flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-smak-neutral-900 dark:text-white shrink-0" />
              Халяль
            </span>
            <USwitch v-model="localFilters.isHalal" size="md" class="shrink-0 cursor-pointer" :ui="{ base: 'data-[state=checked]:bg-coral-500 data-[state=unchecked]:bg-smak-neutral-200 dark:data-[state=unchecked]:bg-smak-neutral-700' }" />
          </div>

          <!-- Kosher -->
          <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800/30 transition-colors">
            <span class="text-xs sm:text-sm text-smak-neutral-700 dark:text-smak-neutral-300 font-bold flex items-center gap-2">
              <UIcon name="i-lucide-shield-check" class="w-4.5 h-4.5 text-smak-neutral-900 dark:text-white shrink-0" />
              Кошерний
            </span>
            <USwitch v-model="localFilters.isKosher" size="md" class="shrink-0 cursor-pointer" :ui="{ base: 'data-[state=checked]:bg-coral-500 data-[state=unchecked]:bg-smak-neutral-200 dark:data-[state=unchecked]:bg-smak-neutral-700' }" />
          </div>

        </div>
      </div>

    </div>

    <!-- Panel Actions Footer -->
    <div class="flex items-center justify-end gap-3 border-t border-smak-neutral-100 dark:border-smak-neutral-800 pt-4 shrink-0 mt-2 z-10">
      <button
        type="button"
        class="shrink-0 rounded-full font-bold px-7 py-3 bg-transparent hover:bg-transparent text-smak-neutral-700 dark:text-smak-neutral-200 border border-smak-neutral-200 dark:border-smak-neutral-700 hover:border-coral-500 hover:text-coral-500 transition-all cursor-pointer text-sm"
        @click="clearFilters"
      >
        Скинути
      </button>
      <UButton
        size="lg"
        class="shrink-0 rounded-full font-bold px-7 py-3 bg-coral-500 hover:bg-coral-600 text-white shadow-md shadow-coral-500/25 hover:scale-105 transition-all cursor-pointer border-0"
        @click="applyFilters"
      >
        Застосувати
      </UButton>
    </div>

  </div>
</template>
