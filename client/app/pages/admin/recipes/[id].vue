<!--
@page-docs
title: Recipe Details (Admin)
description: Detailed view of a single recipe for administrators on the SMAK platform.
features:
  - View detailed recipe information (category, complexity, times, health score, taste profile, ingredients, directions).
  - View recipe media files (cover image, gallery images, YouTube video).
  - Review author public profile details (verification, ban status).
  - Perform moderation actions on the recipe (approve, request changes, reject, archive).
  - Read and manage user reviews/comments for this recipe, with individual review moderation and review logs history.
  - Inspect the full moderation timeline history of the recipe.
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | Recipe Details (Admin)'
})
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminRecipes } from '~/composables/useAdminRecipes'
import { useAdminModeration } from '~/composables/useAdminModeration'
import { useRecipeReviews } from '~/composables/useRecipeReviews'
import type { RecipeAdminResponseDto, RecipeStatus } from '~/types/recipe'
import type { ModerationLog } from '~/types/moderation'
import { 
  translateCategory, 
  translateDifficulty, 
  translateCookSpeed, 
  translateCuisine, 
  translateTaste,
  statusTranslations,
  formatDate 
} from '~/utils/formatters'
import CloudImage from '~/components/shared/CloudImage.vue'
import ModerationLogTimeline from '~/components/admin/ModerationLogTimeline.vue'
import ModerationActionModal from '~/components/admin/ModerationActionModal.vue'
import { useCloudinary } from '~/composables/useCloudinary'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const recipeId = route.params.id as string

const { fetchRecipe, updateStatus, loading, error } = useAdminRecipes()
const { 
  fetchRecipeLogs, 
  fetchReviewLogs, 
  deleteReview: adminDeleteReview, 
  loading: logsLoading 
} = useAdminModeration()
const { fetchReviews, loading: reviewsLoading } = useRecipeReviews()

const recipe = ref<RecipeAdminResponseDto | null>(null)
const logs = ref<ModerationLog[]>([])
const isModerationModalOpen = ref(false)

const recipeReviews = ref<any[]>([])

const { getUrl } = useCloudinary()
const isImageModalOpen = ref(false)
const selectedImageId = ref('')

const openImageModal = (id: string) => {
  selectedImageId.value = id
  isImageModalOpen.value = true
}

const fullImageUrl = computed(() => {
  if (!selectedImageId.value) return ''
  return getUrl(selectedImageId.value)
})

const loadRecipe = async () => {
  try {
    recipe.value = await fetchRecipe(recipeId)
  } catch (err) {
    console.error('Failed to load recipe', err)
  }
}

const loadLogs = async () => {
  try {
    logs.value = await fetchRecipeLogs(recipeId)
  } catch (err) {
    console.error('Failed to load recipe logs', err)
  }
}

const loadReviews = async () => {
  try {
    const res = await fetchReviews(recipeId, 1, 100)
    if (res && res.data) {
      recipeReviews.value = res.data
    } else {
      recipeReviews.value = []
    }
  } catch (err) {
    console.error('Failed to load reviews', err)
  }
}

onMounted(() => {
  loadRecipe()
  loadLogs()
  loadReviews()
})

const getStatusColor = (status: RecipeStatus) => {
  switch (status) {
    case 'public': return 'success'
    case 'draft': return 'neutral'
    case 'archived': return 'warning'
    case 'rejected': return 'error'
    case 'premoderation': return 'primary'
    case 'moderation': return 'neutral'
    default: return 'neutral'
  }
}

const getStatusLabel = (status: RecipeStatus) => {
  return statusTranslations[status] || status
}

const handleStatusChange = async (newStatus: RecipeStatus) => {
  try {
    await updateStatus(recipeId, newStatus)
    if (recipe.value) {
      recipe.value.status = newStatus
    }
    await loadLogs()
  } catch (err) {
    console.error('Failed to update status', err)
  }
}

const onModerationSuccess = async () => {
  await loadRecipe()
  await loadLogs()
}

// Review Moderation Modal states & methods
const isReviewModerationModalOpen = ref(false)
const selectedReviewIdForAction = ref('')
const reviewActionModalTitle = ref('')

const openReviewModeration = (review: any) => {
  selectedReviewIdForAction.value = review.id
  reviewActionModalTitle.value = `Модерація відгуку користувача @${review.user?.username}`
  isReviewModerationModalOpen.value = true
}

const onReviewModerationSuccess = () => {
  loadReviews()
}

// Review Logs Modal states & methods
const isReviewLogsModalOpen = ref(false)
const reviewLogsModalTitle = ref('')
const activeReviewLogs = ref<ModerationLog[]>([])
const loadingReviewLogs = ref(false)

const viewReviewLogs = async (review: any) => {
  reviewLogsModalTitle.value = `Історія модерації відгуку користувача @${review.user?.username}`
  isReviewLogsModalOpen.value = true
  loadingReviewLogs.value = true
  activeReviewLogs.value = []
  try {
    activeReviewLogs.value = await fetchReviewLogs(review.id)
  } catch (err) {
    console.error('Failed to load review logs', err)
  } finally {
    loadingReviewLogs.value = false
  }
}

// Delete Review Confirmation states & methods
const isDeleteReviewModalOpen = ref(false)
const selectedReviewForDelete = ref<any>(null)

const confirmDeleteReview = (review: any) => {
  selectedReviewForDelete.value = review
  isDeleteReviewModalOpen.value = true
}

const applyDeleteReview = async () => {
  if (selectedReviewForDelete.value) {
    try {
      await adminDeleteReview(selectedReviewForDelete.value.id)
      isDeleteReviewModalOpen.value = false
      selectedReviewForDelete.value = null
      loadReviews()
    } catch (err) {
      console.error('Failed to delete review', err)
    }
  }
}

const goBack = () => {
  router.push('/admin/recipes')
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white" v-if="recipe">
          {{ recipe.title }}
        </h1>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white" v-else>
          Завантаження...
        </h1>
      </div>
      
      <div class="flex items-center gap-3" v-if="recipe">
        <UBadge :color="getStatusColor(recipe.status)" size="lg">
          {{ getStatusLabel(recipe.status) }}
        </UBadge>

        <UButton 
          v-if="recipe.status === 'moderation' || recipe.status === 'premoderation'"
          icon="i-lucide-shield-check" 
          color="primary" 
          variant="solid" 
          @click="isModerationModalOpen = true"
          class="shadow-lg shadow-coral-500/10 cursor-pointer animate-pulse"
        >
          Прийняти рішення
        </UButton>

        <UButton icon="i-lucide-pencil" color="neutral" variant="solid" @click="router.push(`/admin/recipes/edit/${recipeId}`)">
          Редагувати
        </UButton>
        
        <UDropdownMenu :items="[
          [
            { label: 'Опублікувати', icon: 'i-lucide-check', onSelect: () => handleStatusChange('public') },
            { label: 'На модерацію', icon: 'i-lucide-shield', onSelect: () => handleStatusChange('moderation') },
            { label: 'Відхилити', icon: 'i-lucide-x', onSelect: () => handleStatusChange('rejected') }
          ],
          [
            { label: 'В архів', icon: 'i-lucide-archive', onSelect: () => handleStatusChange('archived') },
            { label: 'У чернетку', icon: 'i-lucide-file-text', onSelect: () => handleStatusChange('draft') }
          ]
        ]">
          <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw">
            Змінити статус
          </UButton>
        </UDropdownMenu>
      </div>
    </div>

    <!-- Error State -->
    <UAlert v-if="error" color="error" icon="i-lucide-alert-triangle" :title="error" class="mb-6" />

    <!-- Loading State -->
    <div v-if="loading && !recipe" class="flex justify-center items-center h-64">
      <span class="text-gray-500">Завантаження деталей рецепту...</span>
    </div>

    <!-- Content -->
    <div v-if="recipe" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Main Info (Left Column) -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Recipe Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">Основна інформація</h2>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span class="text-sm text-gray-500">Категорія</span>
              <p class="font-medium">{{ translateCategory(recipe.category) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Складність</span>
              <p class="font-medium">{{ translateDifficulty(recipe.difficulty) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Швидкість</span>
              <p class="font-medium">{{ translateCookSpeed(recipe.cookSpeed) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Час підготовки</span>
              <p class="font-medium">{{ recipe.prepTime }} хв</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Час приготування</span>
              <p class="font-medium">{{ recipe.cookTime }} хв</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Індекс здоров'я</span>
              <p class="font-medium">{{ recipe.healthScore }}/100</p>
            </div>
          </div>

          <div class="mb-4">
            <span class="text-sm text-gray-500">Опис</span>
            <p class="text-gray-700 dark:text-gray-300 mt-1">{{ recipe.description || 'Немає опису' }}</p>
          </div>

          <div class="flex flex-wrap gap-2 mb-4">
            <UBadge v-if="recipe.isVegan" color="success" variant="solid">Vegan</UBadge>
            <UBadge v-if="recipe.isVegetarian" color="success" variant="solid">Vegetarian</UBadge>
            <UBadge v-if="recipe.isGluten_free" color="primary" variant="solid">Gluten Free</UBadge>
            <UBadge v-if="recipe.isHalal" color="warning" variant="solid">Halal</UBadge>
            <UBadge v-if="recipe.isKosher" color="warning" variant="solid">Kosher</UBadge>
            <UBadge v-if="recipe.isDairyFree" color="ai-indigo" variant="solid">Dairy Free</UBadge>
            <UBadge v-if="recipe.isNutFree" color="ai-indigo" variant="solid">Nut Free</UBadge>
          </div>
          
          <div class="mb-4">
            <span class="text-sm text-gray-500">Кухні</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <UBadge v-for="cuisine in recipe.cuisineList" :key="cuisine" color="coral" variant="soft">
                {{ translateCuisine(cuisine) }}
              </UBadge>
              <span v-if="!recipe.cuisineList?.length" class="text-gray-500 text-sm">Не вказано</span>
            </div>
          </div>

          <div>
            <span class="text-sm text-gray-500">Смаковий профіль</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <UBadge v-for="taste in recipe.tastes" :key="taste" color="ai-indigo" variant="soft">
                {{ translateTaste(taste) }}
              </UBadge>
              <span v-if="!recipe.tastes?.length" class="text-gray-500 text-sm">Не вказано</span>
            </div>
          </div>
        </div>

        <!-- Ingredients & Directions -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-semibold mb-3 border-b pb-1">Інгредієнти</h3>
              <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li v-for="(ingredient, index) in recipe.ingredients" :key="index">
                  {{ ingredient }}
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-lg font-semibold mb-3 border-b pb-1">Інструкції</h3>
              <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li v-for="(direction, index) in recipe.directions" :key="index">
                  {{ direction }}
                </li>
              </ol>
            </div>
          </div>
        </div>

        <!-- Media -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">Медіа</h2>
          
          <div class="space-y-4">
            <div v-if="recipe.coverImageId" class="flex flex-col gap-2">
              <div>
                <span class="text-sm text-gray-500">Головне зображення (ID: <span class="font-mono">{{ recipe.coverImageId }}</span>):</span>
              </div>
              <div class="w-48 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity" @click="openImageModal(recipe.coverImageId)">
                <CloudImage :publicId="recipe.coverImageId" aspect="auto" />
              </div>
            </div>
            
            <div v-if="recipe.galleryImageIds?.length" class="flex flex-col gap-2">
              <div>
                <span class="text-sm text-gray-500">Зображення галереї:</span>
              </div>
              <div class="flex flex-wrap gap-4 mt-1">
                <div v-for="id in recipe.galleryImageIds" :key="id" class="flex flex-col gap-1">
                  <span class="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">{{ id }}</span>
                  <div class="w-32 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity" @click="openImageModal(id)">
                    <CloudImage :publicId="id" aspect="auto" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="recipe.youtubeVideoUrl">
              <span class="text-sm text-gray-500">YouTube Відео:</span>
              <a :href="recipe.youtubeVideoUrl" target="_blank" class="text-primary hover:underline ml-2">
                {{ recipe.youtubeVideoUrl }}
              </a>
            </div>
            
            <div v-if="!recipe.coverImageId && !recipe.galleryImageIds?.length && !recipe.youtubeVideoUrl" class="text-gray-500 text-sm">
              Медіафайли відсутні
            </div>
          </div>
        </div>

        <!-- Recipe Reviews for Admin -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2 flex items-center justify-between">
            <span>Відгуки до цього рецепту</span>
            <UBadge v-if="recipeReviews?.length" color="neutral" variant="subtle" size="sm">
              Всього: {{ recipeReviews.length }}
            </UBadge>
          </h2>

          <div v-if="reviewsLoading" class="text-center py-6 text-sm text-gray-500">
            Завантаження відгуків...
          </div>
          <div v-else-if="!recipeReviews?.length" class="text-center py-6 text-sm text-gray-500 italic">
            На цей рецепт ще немає відгуків.
          </div>
          <div v-else class="space-y-4">
            <div 
              v-for="review in recipeReviews" 
              :key="review.id" 
              class="border-b border-gray-100 dark:border-gray-800 last:border-b-0 pb-4 last:pb-0 flex flex-col md:flex-row justify-between gap-4"
            >
              <div class="space-y-2 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <NuxtLink 
                    v-if="review.user?.id" 
                    :to="`/admin/users/${review.user.id}`" 
                    class="font-bold text-sm text-gray-700 dark:text-gray-300 hover:underline"
                  >
                    {{ review.user.displayname || 'Без імені' }}
                  </NuxtLink>
                  <span v-else class="font-bold text-sm text-gray-700 dark:text-gray-300">
                    {{ review.user?.displayname || 'Без імені' }}
                  </span>
                  
                  <span class="text-xs text-gray-400">@{{ review.user?.username }}</span>
                  
                  <div class="flex items-center gap-0.5 ml-2">
                    <span class="text-sm font-bold text-gray-900 dark:text-white mr-1">{{ review.rating }}</span>
                    <UIcon name="i-lucide-star" class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                  
                  <UBadge :color="review.isPublished ? 'success' : 'warning'" size="xs" class="ml-2">
                    {{ review.isPublished ? 'Опубліковано' : 'Неопубліковано' }}
                  </UBadge>
                </div>
                
                <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-900/30 p-3 rounded-lg border border-gray-100/50 dark:border-gray-800">
                  {{ review.text || 'Без текстового коментаря' }}
                </p>
                
                <div class="text-xs text-gray-400">
                  Створено: {{ formatDate(review.createdAt) }}
                </div>
              </div>

              <!-- Admin actions for review -->
              <div class="flex items-center gap-2 self-end md:self-start">
                <UButton 
                  icon="i-lucide-shield-alert" 
                  color="primary" 
                  size="xs" 
                  @click="openReviewModeration(review)"
                  class="cursor-pointer"
                  label="Модерувати"
                />
                <UButton 
                  icon="i-lucide-history" 
                  color="neutral" 
                  variant="outline" 
                  size="xs" 
                  @click="viewReviewLogs(review)"
                  class="cursor-pointer"
                  label="Логи"
                />
                <UButton 
                  icon="i-lucide-trash-2" 
                  color="error" 
                  variant="ghost" 
                  size="xs" 
                  @click="confirmDeleteReview(review)"
                  class="cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Author & Meta (Right Column) -->
      <div class="space-y-6">
        
        <!-- Author Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">Автор</h2>
          
          <div v-if="recipe.user" class="space-y-3">
            <div>
              <span class="text-sm text-gray-500">ID Користувача</span>
              <p class="font-mono text-sm truncate">{{ recipe.user.id }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Ім'я (Displayname)</span>
              <p class="font-medium">{{ recipe.user.displayname || 'Без імені' }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Username</span>
              <p class="font-medium">@{{ recipe.user.username }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Email</span>
              <p class="font-medium">{{ recipe.user.email }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Роль</span>
              <p><UBadge color="neutral">{{ recipe.user.role }}</UBadge></p>
            </div>
            <div class="flex gap-4">
              <div>
                <span class="text-sm text-gray-500">Верифікований</span>
                <p>
                  <UBadge :color="recipe.user.isVerified ? 'success' : 'warning'">
                    {{ recipe.user.isVerified ? 'Так' : 'Ні' }}
                  </UBadge>
                </p>
              </div>
              <div>
                <span class="text-sm text-gray-500">Забанений</span>
                <p>
                  <UBadge :color="recipe.user.isBanned ? 'error' : 'success'">
                    {{ recipe.user.isBanned ? 'Так' : 'Ні' }}
                  </UBadge>
                </p>
              </div>
            </div>
            
            <div class="pt-2">
              <UButton :to="`/admin/users/${recipe.user.id}`" color="primary" variant="soft" block>
                Переглянути профіль автора
              </UButton>
            </div>
          </div>
          <div v-else class="text-gray-500">
            Інформація про автора відсутня
          </div>
        </div>

        <!-- System Meta -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">Системна інформація</h2>
          
          <div class="space-y-3">
            <div>
              <span class="text-sm text-gray-500">ID Рецепту</span>
              <p class="font-mono text-sm truncate">{{ recipe.id }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Рейтинг</span>
              <p class="font-medium">{{ recipe.rating }} ({{ recipe.numRatings }} оцінок)</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Створено</span>
              <p class="font-medium">{{ formatDate(recipe.createdAt) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Останнє оновлення</span>
              <p class="font-medium">{{ formatDate(recipe.updatedAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Moderation Logs -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2 flex items-center justify-between">
            <span>Журнал модерації</span>
            <UButton 
              v-if="recipe.status === 'moderation' || recipe.status === 'premoderation'"
              icon="i-lucide-shield-alert"
              size="xs"
              variant="ghost"
              color="primary"
              @click="isModerationModalOpen = true"
              class="cursor-pointer"
              label="Модерувати"
            />
          </h2>
          <ModerationLogTimeline :logs="logs" :loading="logsLoading" />
        </div>
      </div>

    </div>

    <!-- Image Preview Modal -->
    <UModal v-model:open="isImageModalOpen" title="Перегляд зображення">
      <template #body>
        <div class="flex justify-center items-center p-2 bg-gray-900/50 rounded-lg">
          <img :src="fullImageUrl" class="max-h-[80vh] max-w-full object-contain rounded-lg" alt="Повнорозмірне зображення" />
        </div>
      </template>
    </UModal>

    <!-- Moderation Decision Modal -->
    <ModerationActionModal
      v-if="recipe"
      v-model:open="isModerationModalOpen"
      :id="recipeId"
      type="recipe"
      :title="`Модерація: ${recipe.title}`"
      @success="onModerationSuccess"
    />

    <!-- Review Moderation Modal -->
    <ModerationActionModal
      v-model:open="isReviewModerationModalOpen"
      :id="selectedReviewIdForAction"
      type="review"
      :title="reviewActionModalTitle"
      @success="onReviewModerationSuccess"
    />

    <!-- Review Moderation Logs Modal -->
    <UModal 
      v-model:open="isReviewLogsModalOpen" 
      :title="reviewLogsModalTitle"
      :ui="{ content: 'sm:max-w-xl rounded-3xl' }"
    >
      <template #body>
        <div class="max-h-[60vh] overflow-y-auto pr-2">
          <ModerationLogTimeline :logs="activeReviewLogs" :loading="loadingReviewLogs" />
        </div>
      </template>
      <template #footer>
        <UButton 
          label="Закрити" 
          color="neutral" 
          variant="outline" 
          block 
          @click="isReviewLogsModalOpen = false" 
          class="rounded-xl font-bold cursor-pointer"
        />
      </template>
    </UModal>

    <!-- Delete Review Confirmation Modal -->
    <UModal 
      v-model:open="isDeleteReviewModalOpen" 
      :ui="{ content: 'sm:max-w-md rounded-3xl' }"
    >
      <template #content>
        <div class="p-6 sm:p-8 space-y-6 text-left">
          <div class="space-y-2">
            <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              Видалити відгук?
            </h3>
            <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed">
              Ви впевнені, що хочете видалити цей відгук? Ця дія повністю видалить відгук та всі коментарі до нього.
            </p>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <UButton 
              label="Скасувати" 
              color="neutral" 
              variant="ghost" 
              class="flex-1 justify-center rounded-xl py-3 font-bold cursor-pointer"
              @click="isDeleteReviewModalOpen = false" 
            />
            <UButton 
              label="Видалити" 
              color="error" 
              variant="solid"
              class="flex-1 justify-center rounded-xl py-3 font-bold shadow-lg shadow-rose-500/20 cursor-pointer"
              @click="applyDeleteReview" 
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
