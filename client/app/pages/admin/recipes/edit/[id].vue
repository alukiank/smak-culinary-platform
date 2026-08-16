<!--
@page-docs
title: Recipe Editing (Admin)
description: Page for editing details and metadata of an existing recipe by administrators on the SMAK platform.
features:
  - Edit recipe title, description, category, and world cuisines.
  - Dynamically add, modify, or remove recipe ingredients and step-by-step directions.
  - Configure preparation time, cooking time, difficulty level, cooking speed, and tastes.
  - Set a health score percentage using an interactive visual slider.
  - Set dietary flags (vegan, vegetarian, gluten free, dairy free, nut free, halal, kosher).
  - Add or update cover/gallery images and YouTube video URLs.
  - Choose post-saving recipe status (keep as is or change to draft).
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | Recipe Editing (Admin)'
})
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecipes } from '~/composables/useRecipes'
import { useAdminRecipes } from '~/composables/useAdminRecipes'
import RecipeImageSlider from '~/components/recipe/detail/RecipeImageSlider.vue'
import type { CreateRecipeDto, RecipeStatus } from '~/types/recipe'
import {
  categoryTranslations,
  cuisineTranslations,
  tasteTranslations,
  difficultyTranslations,
  cookSpeedTranslations
} from '~/utils/formatters'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin'
})

const router = useRouter()
const route = useRoute()
const recipeId = route.params.id as string

const { updateRecipe, loading: updateLoading, error: apiError } = useAdminRecipes()
const { fetchRecipe, loading: fetchLoading } = useAdminRecipes()

const sliderRef = ref<any>(null)
const formError = ref<string | null>(null)
const isRecipeLoaded = ref(false)

const targetStatusOptions = [
  { value: 'as_is', label: 'Лишити як є' },
  { value: 'draft', label: 'Чернетка' }
]
const selectedTargetStatus = ref(targetStatusOptions[0])

interface AdminEditRecipeDto extends Omit<CreateRecipeDto, 'status'> {
  status: RecipeStatus
}

const form = ref<AdminEditRecipeDto>({
  title: '',
  category: 'Soups & Stews',
  description: '',
  ingredients: [''],
  directions: [''],
  cookSpeed: 'medium',
  prepTime: 15,
  cookTime: 30,
  difficulty: 'medium',
  cuisineList: [],
  tastes: [],
  ingredientsSearch: [],
  isVegan: false,
  isVegetarian: false,
  isGluten_free: false,
  isHalal: false,
  isKosher: false,
  isDairyFree: false,
  isNutFree: false,
  healthScore: 75,
  status: 'draft',
  coverImageId: null,
  galleryImageIds: [],
  youtubeVideoUrl: ''
})

const loading = computed(() => fetchLoading.value || updateLoading.value)

onMounted(async () => {
  try {
    const recipe = await fetchRecipe(recipeId)
    if (recipe) {
      // Populate form
      form.value = {
        title: recipe.title,
        category: recipe.category,
        description: recipe.description || '',
        ingredients: recipe.ingredients || [''],
        directions: recipe.directions || [''],
        cookSpeed: recipe.cookSpeed,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        cuisineList: recipe.cuisineList || [],
        tastes: recipe.tastes || [],
        ingredientsSearch: [], // Generated on submit
        isVegan: recipe.isVegan,
        isVegetarian: recipe.isVegetarian,
        isGluten_free: recipe.isGluten_free,
        isHalal: recipe.isHalal,
        isKosher: recipe.isKosher,
        isDairyFree: recipe.isDairyFree,
        isNutFree: recipe.isNutFree,
        healthScore: recipe.healthScore,
        status: recipe.status,
        coverImageId: recipe.coverImageId,
        galleryImageIds: recipe.galleryImageIds || [],
        youtubeVideoUrl: recipe.youtubeVideoUrl || ''
      }
      isRecipeLoaded.value = true
    }
  } catch (err) {
    console.error('Failed to fetch recipe for editing', err)
  }
})

const categoryOptions = Object.entries(categoryTranslations).map(([value, label]) => ({ label, value }))
const cuisineOptions = Object.entries(cuisineTranslations).map(([value, label]) => ({ label, value }))
const tasteOptions = Object.entries(tasteTranslations).map(([value, label]) => ({ label, value }))
const difficultyOptions = Object.entries(difficultyTranslations).map(([value, label]) => ({ label, value }))
const cookSpeedOptions = Object.entries(cookSpeedTranslations).map(([value, label]) => ({ label, value }))

const addIngredient = () => { form.value.ingredients.push('') }
const removeIngredient = (i: number) => { if (form.value.ingredients.length > 1) form.value.ingredients.splice(i, 1) }
const addDirection = () => { form.value.directions.push('') }
const removeDirection = (i: number) => { if (form.value.directions.length > 1) form.value.directions.splice(i, 1) }

const healthColor = computed(() => {
  const score = form.value.healthScore ?? 0
  if (score > 80) return '#10b981'
  if (score > 50) return '#f59e0b'
  return '#ef4444'
})

const onSubmit = async () => {
  formError.value = null
  if (!form.value.title.trim()) {
    formError.value = 'Введіть назву рецепту.'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const cleanedIngredients = form.value.ingredients.map((i: string) => i.trim()).filter(Boolean)
  const cleanedDirections = form.value.directions.map((d: string) => d.trim()).filter(Boolean)
  if (!cleanedIngredients.length) { formError.value = 'Додайте хоча б один інгредієнт.'; return }
  if (!cleanedDirections.length) { formError.value = 'Додайте хоча б один крок приготування.'; return }

  // 1. Upload images from slider first
  let uploadedIds = { coverId: form.value.coverImageId, galleryIds: form.value.galleryImageIds }
  if (sliderRef.value) {
    try {
      uploadedIds = await sliderRef.value.uploadAndGetIds()
    } catch (err) {
      console.error('Failed to upload images:', err)
    }
  }

  const finalStatus = (selectedTargetStatus.value?.value === 'as_is' || !selectedTargetStatus.value)
    ? form.value.status 
    : (selectedTargetStatus.value?.value || 'as_is')
    
  const statusToSend = ['draft', 'premoderation'].includes(finalStatus) ? finalStatus : undefined

  try {
    await updateRecipe(recipeId, {
      ...form.value,
      coverImageId: uploadedIds.coverId,
      galleryImageIds: uploadedIds.galleryIds,
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      ingredients: cleanedIngredients,
      directions: cleanedDirections,
      ingredientsSearch: cleanedIngredients.map((i: string) => i.toLowerCase()),
      status: statusToSend
    } as any)
    router.push(`/admin/recipes/${recipeId}`)
  } catch (err) {
    console.error('Failed to update recipe:', err)
  }
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Редагування рецепту (Адмін)
        </h1>
      </div>
    </div>

    <!-- Top Image Slider -->
    <div class="mb-10" v-if="isRecipeLoaded">
      <RecipeImageSlider 
        ref="sliderRef"
        :initial-cover-id="form.coverImageId"
        :initial-gallery-ids="form.galleryImageIds"
      />
    </div>
    <div v-else class="flex justify-center items-center h-64 mb-10 bg-gray-100 dark:bg-gray-800 rounded-2xl">
      <span class="text-gray-500">Завантаження зображень...</span>
    </div>

    <!-- Main Content -->
    <div class="pb-20">

      <!-- Error Alert -->
      <Transition name="fade">
        <div
          v-if="formError || apiError"
          class="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400"
        >
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-sm">Помилка валідації</p>
            <p class="text-xs mt-0.5">{{ formError || apiError }}</p>
          </div>
        </div>
      </Transition>

      <form @submit.prevent class="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 xl:gap-10 items-start">

        <!-- LEFT COLUMN — main form sections -->
        <div class="space-y-6 min-w-0">

          <!-- SECTION 1: Загальні відомості -->
          <div class="bg-white dark:bg-smak-neutral-900 rounded-2xl border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-sm overflow-hidden">
            <div class="flex items-center gap-3 px-6 py-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-800/30">
              <div class="w-8 h-8 rounded-xl bg-coral-500 text-white flex items-center justify-center text-sm font-black shrink-0">1</div>
              <h2 class="font-heading font-bold text-base text-smak-neutral-900 dark:text-white">Загальні відомості</h2>
            </div>
            <div class="p-6 space-y-5">
              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-smak-neutral-700 dark:text-smak-neutral-300">
                  Назва рецепту <span class="text-coral-500">*</span>
                </label>
                <UInput
                  v-model="form.title"
                  placeholder="Наприклад: Ніжний італійський тірамісу"
                  size="lg"
                  class="w-full"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold text-smak-neutral-700 dark:text-smak-neutral-300">
                    Категорія <span class="text-coral-500">*</span>
                  </label>
                  <USelect
                    v-model="form.category"
                    :items="categoryOptions"
                    size="lg"
                    class="w-full"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold text-smak-neutral-700 dark:text-smak-neutral-300">Кухні світу</label>
                  <USelectMenu
                    v-model="form.cuisineList"
                    :items="cuisineOptions"
                    multiple
                    placeholder="Виберіть кухні..."
                    size="lg"
                    class="w-full"
                    value-key="value"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-sm font-semibold text-smak-neutral-700 dark:text-smak-neutral-300">Опис або історія страви</label>
                <UTextarea
                  v-model="form.description"
                  :rows="4"
                  placeholder="Розкажіть, чим особливий цей рецепт, які секрети приготування..."
                  size="lg"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- SECTION 2: Час та складність -->
          <div class="bg-white dark:bg-smak-neutral-900 rounded-2xl border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-sm overflow-hidden">
            <div class="flex items-center gap-3 px-6 py-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-800/30">
              <div class="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center text-sm font-black shrink-0">2</div>
              <h2 class="font-heading font-bold text-base text-smak-neutral-900 dark:text-white">Час та складність</h2>
            </div>
            <div class="p-6 space-y-5">
              <!-- Time + Difficulty grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wide">Підготовка (хв)</label>
                  <UInput v-model.number="form.prepTime" type="number" min="0" size="lg" class="w-full" />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wide">Готування (хв)</label>
                  <UInput v-model.number="form.cookTime" type="number" min="0" size="lg" class="w-full" />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wide">Складність</label>
                  <USelect v-model="form.difficulty" :items="difficultyOptions" size="lg" class="w-full" />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wide">Швидкість</label>
                  <USelect v-model="form.cookSpeed" :items="cookSpeedOptions" size="lg" class="w-full" />
                </div>
              </div>

              <!-- Health + Tastes -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-smak-neutral-100 dark:border-smak-neutral-800">
                <!-- Health Score Selector -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <UIcon 
                        :name="(form.healthScore ?? 0) > 80 ? 'i-lucide-heart-pulse' : (form.healthScore ?? 0) > 50 ? 'i-lucide-salad' : 'i-lucide-sandwich'" 
                        class="w-5 h-5 transition-all duration-500"
                        :class="(form.healthScore ?? 0) > 80 ? 'text-emerald-500 scale-110' : (form.healthScore ?? 0) > 50 ? 'text-amber-500' : 'text-rose-500'"
                      />
                      <label class="text-sm font-bold text-smak-neutral-800 dark:text-white">Показник корисності</label>
                    </div>
                    <div class="px-3 py-1 rounded-full bg-smak-neutral-50 dark:bg-smak-neutral-800 border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-xs">
                      <span class="text-sm font-black transition-colors" :class="(form.healthScore ?? 0) > 80 ? 'text-emerald-500' : (form.healthScore ?? 0) > 50 ? 'text-amber-500' : 'text-rose-500'">
                        {{ form.healthScore }}%
                      </span>
                    </div>
                  </div>
                  
                  <div class="relative group pt-2 pb-1">
                    <input 
                      v-model.number="form.healthScore" 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="1"
                      class="w-full h-2.5 bg-smak-neutral-200 dark:bg-smak-neutral-800 rounded-lg appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      :style="{ accentColor: healthColor }"
                    />
                    
                    <!-- Custom Gradient Track Visualizer -->
                    <div class="mt-4 flex justify-between px-0.5">
                      <span class="text-[10px] font-black text-rose-500/80 dark:text-rose-400 uppercase tracking-wider" :class="{ 'scale-110': (form.healthScore ?? 0) <= 50 }">Fast Food</span>
                      <span class="text-[10px] font-black text-amber-500/80 dark:text-amber-400 uppercase tracking-wider" :class="{ 'scale-110': (form.healthScore ?? 0) > 50 && (form.healthScore ?? 0) <= 80 }">Balanced</span>
                      <span class="text-[10px] font-black text-emerald-500/80 dark:text-emerald-400 uppercase tracking-wider" :class="{ 'scale-110': (form.healthScore ?? 0) > 80 }">Healthy</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-smak-neutral-400 leading-tight">
                    Оцініть наскільки збалансованою та корисною є ця страва за 100-бальною шкалою.
                  </p>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-sm font-semibold text-smak-neutral-700 dark:text-smak-neutral-300">Смаковий профіль</label>
                  <USelectMenu
                    v-model="form.tastes"
                    :items="tasteOptions"
                    multiple
                    placeholder="Оберіть нотки смаку..."
                    size="lg"
                    class="w-full"
                    value-key="value"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 3: Інгредієнти -->
          <div class="bg-white dark:bg-smak-neutral-900 rounded-2xl border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-800/30">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-black shrink-0">3</div>
                <h2 class="font-heading font-bold text-base text-smak-neutral-900 dark:text-white">
                  Інгредієнти <span class="text-coral-500">*</span>
                </h2>
              </div>
              <UButton variant="subtle" color="primary" size="sm" icon="i-lucide-plus" @click="addIngredient" class="font-bold">
                Додати
              </UButton>
            </div>
            <div class="p-6 space-y-2.5">
              <TransitionGroup name="list">
                <div
                  v-for="(ing, idx) in form.ingredients"
                  :key="idx"
                  class="flex items-center gap-2.5"
                >
                  <div class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                    {{ idx + 1 }}
                  </div>
                  <UInput
                    v-model="form.ingredients[idx]"
                    placeholder="Наприклад: 200г Маскарпоне"
                    size="lg"
                    class="flex-1"
                  />
                  <UButton
                    :disabled="form.ingredients.length <= 1"
                    variant="ghost"
                    color="error"
                    icon="i-lucide-x"
                    size="sm"
                    @click="removeIngredient(idx)"
                    class="shrink-0"
                  />
                </div>
              </TransitionGroup>
            </div>
          </div>

          <!-- SECTION 4: Кроки -->
          <div class="bg-white dark:bg-smak-neutral-900 rounded-2xl border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-800/30">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center text-sm font-black shrink-0">4</div>
                <h2 class="font-heading font-bold text-base text-smak-neutral-900 dark:text-white">
                  Кроки приготування <span class="text-coral-500">*</span>
                </h2>
              </div>
              <UButton variant="subtle" color="primary" size="sm" icon="i-lucide-plus" @click="addDirection" class="font-bold">
                Додати крок
              </UButton>
            </div>
            <div class="p-6 space-y-3">
              <TransitionGroup name="list">
                <div
                  v-for="(dir, idx) in form.directions"
                  :key="idx"
                  class="flex items-start gap-3"
                >
                  <div class="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black shrink-0 mt-2">
                    {{ idx + 1 }}
                  </div>
                  <UTextarea
                    v-model="form.directions[idx]"
                    :rows="2"
                    placeholder="Опишіть дію детально..."
                    size="lg"
                    class="flex-1"
                    autoresize
                  />
                  <UButton
                    :disabled="form.directions.length <= 1"
                    variant="ghost"
                    color="error"
                    icon="i-lucide-x"
                    size="sm"
                    @click="removeDirection(idx)"
                    class="shrink-0 mt-2"
                  />
                </div>
              </TransitionGroup>
            </div>
          </div>

          <!-- SECTION 5: Дієтичні позначки -->
          <div class="bg-white dark:bg-smak-neutral-900 rounded-2xl border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-sm overflow-hidden">
            <div class="flex items-center gap-3 px-6 py-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-800/30">
              <div class="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center text-sm font-black shrink-0">5</div>
              <h2 class="font-heading font-bold text-base text-smak-neutral-900 dark:text-white">Дієтичні позначки</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <label
                  v-for="item in [
                    { model: 'isVegetarian', emoji: '🥦', label: 'Вегетаріанське' },
                    { model: 'isVegan', emoji: '🌱', label: 'Веган' },
                    { model: 'isGluten_free', emoji: '🌾', label: 'Без глютену' },
                    { model: 'isDairyFree', emoji: '🥛', label: 'Без лактози' },
                    { model: 'isNutFree', emoji: '🥜', label: 'Без горіхів' },
                    { model: 'isHalal', emoji: '🕌', label: 'Халяль' },
                    { model: 'isKosher', emoji: '✡️', label: 'Кошерне' },
                  ]"
                  :key="item.model"
                  class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-200"
                  :class="(form as any)[item.model]
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20 dark:border-primary-600'
                    : 'border-smak-neutral-100 dark:border-smak-neutral-800 hover:border-smak-neutral-300 dark:hover:border-smak-neutral-600'"
                >
                  <input type="checkbox" v-model="(form as any)[item.model]" class="hidden" />
                  <span class="text-lg leading-none">{{ item.emoji }}</span>
                  <span class="text-xs font-semibold text-smak-neutral-700 dark:text-smak-neutral-300 leading-tight">{{ item.label }}</span>
                </label>
              </div>
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN -->
        <div class="mt-6 lg:mt-0 space-y-6">


          <!-- YouTube -->
          <div class="bg-white dark:bg-smak-neutral-900 rounded-2xl border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-sm overflow-hidden">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-800/30">
              <UIcon name="i-lucide-video" class="w-4 h-4 text-smak-neutral-400" />
              <h2 class="font-heading font-bold text-sm text-smak-neutral-900 dark:text-white">Відеорецепт</h2>
            </div>
            <div class="p-5 space-y-2">
              <UInput
                v-model="form.youtubeVideoUrl"
                placeholder="https://youtube.com/watch?v=..."
                icon="i-lucide-link"
                size="md"
                class="w-full"
              />
              <p class="text-xs text-smak-neutral-400 leading-relaxed">Посилання на YouTube відео для відображення плеєра</p>
            </div>
          </div>

          <!-- Quick Summary -->
          <div class="bg-white dark:bg-smak-neutral-900 rounded-2xl border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-sm overflow-hidden">
            <div class="flex items-center gap-3 px-5 py-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 bg-smak-neutral-50/50 dark:bg-smak-neutral-800/30">
              <UIcon name="i-lucide-list-checks" class="w-4 h-4 text-smak-neutral-400" />
              <h2 class="font-heading font-bold text-sm text-smak-neutral-900 dark:text-white">Зведення</h2>
            </div>
            <div class="p-5 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-smak-neutral-500">Інгредієнти</span>
                <span class="font-bold text-smak-neutral-900 dark:text-white">{{ form.ingredients.filter((i: string) => i.trim()).length }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-smak-neutral-500">Кроків</span>
                <span class="font-bold text-smak-neutral-900 dark:text-white">{{ form.directions.filter((d: string) => d.trim()).length }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-smak-neutral-500">Час загальний</span>
                <span class="font-bold text-smak-neutral-900 dark:text-white">{{ form.prepTime + form.cookTime }} хв</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-smak-neutral-500">Health Score</span>
                <span class="font-bold text-emerald-500">{{ form.healthScore }}%</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <label class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">СТАТУС ПІСЛЯ ЗБЕРЕЖЕННЯ</label>
              <USelectMenu 
                v-model="selectedTargetStatus" 
                :items="targetStatusOptions" 
                class="w-full"
              />
            </div>

            <UButton
              size="lg"
              class="w-full justify-center font-bold text-white bg-brand-gradient border-0 shadow-md hover:shadow-coral-500/30 hover:shadow-lg transition-all duration-200"
              :loading="updateLoading"
              @click="onSubmit()"
            >
              <UIcon name="i-lucide-save" class="w-4 h-4 mr-2" />
              Зберегти зміни
            </UButton>
            <UButton
              variant="outline"
              color="neutral"
              size="lg"
              class="w-full justify-center font-bold"
              @click="router.push(`/admin/recipes/${recipeId}`)"
            >
              Скасувати
            </UButton>
          </div>

        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
