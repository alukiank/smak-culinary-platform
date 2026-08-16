<!--
@page-docs
title: Content Moderation (Admin)
description: Admin panel section for moderation of recipes and user reviews on the SMAK platform.
features:
  - Moderate pending recipes and pre-moderated AI generated submissions.
  - Approve or reject user reviews with mandatory moderation comments on rejection.
  - Search recipes by name and filter by status (moderation, public, rejected).
  - Filter reviews by publishing status (published, unpublished).
  - View full logs and timeline history of moderation actions for recipes and reviews.
  - Delete reviews with confirmation dialogs.
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | Content Moderation (Admin)'
})
import { ref, onMounted, watch } from 'vue'
import { useAdminRecipes } from '~/composables/useAdminRecipes'
import { useAdminModeration } from '~/composables/useAdminModeration'
import type { RecipeStatus, RecipeCategory } from '~/types/recipe'
import type { ModerationLog } from '~/types/moderation'
import { statusTranslations, categoryTranslations, formatDate } from '~/utils/formatters'
import AppPagination from '~/components/shared/AppPagination.vue'
import ModerationLogTimeline from '~/components/admin/ModerationLogTimeline.vue'
import ModerationActionModal from '~/components/admin/ModerationActionModal.vue'
import { useCloudinary } from '~/composables/useCloudinary'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin'
})

// Tab active state
const activeTab = ref<'recipes' | 'reviews'>('recipes')

// Composables
const { 
  recipes, 
  loading: recipesLoading, 
  error: recipesError, 
  meta: recipesMeta, 
  fetchRecipes 
} = useAdminRecipes()

const { 
  reviews, 
  loading: reviewsLoading, 
  error: reviewsError, 
  reviewsMeta, 
  fetchReviews, 
  deleteReview,
  fetchReviewLogs,
  fetchRecipeLogs,
  loading: moderationLoading 
} = useAdminModeration()

// Recipes states & filters
const recipePage = ref(1)
const recipeLimit = ref(10)
const recipeQuery = ref('')
const recipeStatus = ref<RecipeStatus | 'all'>('moderation')

// Reviews states & filters
const reviewPage = ref(1)
const reviewLimit = ref(10)
const reviewPublishStatus = ref<'all' | 'published' | 'unpublished'>('unpublished')

// Cloudinary
const { getUrl } = useCloudinary()

// Expanded reviews state
const expandedReviewIds = ref<string[]>([])
const reviewDecisions = ref<Record<string, 'approved' | 'rejected'>>({})
const reviewReasons = ref<Record<string, string>>({})
const reviewValidationErrors = ref<Record<string, string | null>>({})
const reviewSubmittingIds = ref<Record<string, boolean>>({})

const toggleReviewExpand = (id: string) => {
  if (expandedReviewIds.value.includes(id)) {
    expandedReviewIds.value = expandedReviewIds.value.filter(item => item !== id)
  } else {
    expandedReviewIds.value.push(id)
    if (!reviewDecisions.value[id]) {
      reviewDecisions.value[id] = 'approved'
    }
    if (reviewReasons.value[id] === undefined) {
      reviewReasons.value[id] = ''
    }
    reviewValidationErrors.value[id] = null
  }
}

const submitRowModeration = async (id: string) => {
  const dec = reviewDecisions.value[id] || 'approved'
  const reas = (reviewReasons.value[id] || '').trim()

  if (dec === 'rejected' && !reas) {
    reviewValidationErrors.value[id] = 'Будь ласка, вкажіть причину відхилення'
    return
  }

  reviewValidationErrors.value[id] = null
  reviewSubmittingIds.value[id] = true

  try {
    const { moderateReview: apiModerate } = useAdminModeration()
    await apiModerate(id, dec, reas || undefined)
    await loadReviews()
    expandedReviewIds.value = expandedReviewIds.value.filter(item => item !== id)
    delete reviewDecisions.value[id]
    delete reviewReasons.value[id]
    delete reviewValidationErrors.value[id]
  } catch (err) {
    console.error(`Error moderating review ${id}:`, err)
  } finally {
    reviewSubmittingIds.value[id] = false
  }
}

// Moderation Modal state
const isActionModalOpen = ref(false)
const selectedIdForAction = ref('')
const selectedItemForAction = ref<any>(null)
const actionModalType = ref<'recipe' | 'review'>('recipe')
const actionModalTitle = ref('')

// Logs Modal state
const isLogsModalOpen = ref(false)
const selectedIdForLogs = ref('')
const logsModalType = ref<'recipe' | 'review'>('recipe')
const logsModalTitle = ref('')
const activeLogs = ref<ModerationLog[]>([])
const loadingLogs = ref(false)

// Delete Review Confirmation
const isDeleteReviewModalOpen = ref(false)
const selectedReviewForDelete = ref<any>(null)

// Load recipes based on active status filters
const loadRecipes = () => {
  const status = recipeStatus.value === 'all' ? undefined : recipeStatus.value

  fetchRecipes({
    page: recipePage.value,
    limit: recipeLimit.value,
    query: recipeQuery.value || undefined,
    status: status
  })
}

// Load reviews based on publish status filters
const loadReviews = () => {
  let isPublished: boolean | undefined = undefined
  if (reviewPublishStatus.value === 'published') {
    isPublished = true
  } else if (reviewPublishStatus.value === 'unpublished') {
    isPublished = false
  }

  fetchReviews({
    page: reviewPage.value,
    limit: reviewLimit.value,
    isPublished: isPublished
  })
}

// Initial fetch
onMounted(() => {
  loadRecipes()
  loadReviews()
})

// Watchers for Recipes
watch([recipePage, recipeLimit, recipeStatus], () => {
  loadRecipes()
})

let recipeSearchTimeout: NodeJS.Timeout
watch(recipeQuery, () => {
  clearTimeout(recipeSearchTimeout)
  recipeSearchTimeout = setTimeout(() => {
    recipePage.value = 1
    loadRecipes()
  }, 500)
})

// Watchers for Reviews
watch([reviewPage, reviewLimit, reviewPublishStatus], () => {
  loadReviews()
})

// Moderation action triggers
const openRecipeModeration = (row: any) => {
  selectedIdForAction.value = row.id
  selectedItemForAction.value = row
  actionModalType.value = 'recipe'
  actionModalTitle.value = `Модерація рецепту: ${row.title}`
  isActionModalOpen.value = true
}

const openReviewModeration = (row: any) => {
  selectedIdForAction.value = row.id
  selectedItemForAction.value = row
  actionModalType.value = 'review'
  actionModalTitle.value = `Модерація відгуку користувача @${row.user?.username}`
  isActionModalOpen.value = true
}

// Logs view triggers
const viewRecipeLogs = async (row: any) => {
  selectedIdForLogs.value = row.id
  logsModalType.value = 'recipe'
  logsModalTitle.value = `Історія модерації рецепту: ${row.title}`
  isLogsModalOpen.value = true
  
  loadingLogs.value = true
  activeLogs.value = []
  try {
    activeLogs.value = await fetchRecipeLogs(row.id)
  } catch (err) {
    console.error(err)
  } finally {
    loadingLogs.value = false
  }
}

const viewReviewLogs = async (row: any) => {
  selectedIdForLogs.value = row.id
  logsModalType.value = 'review'
  logsModalTitle.value = `Історія модерації відгуку користувача @${row.user?.username}`
  isLogsModalOpen.value = true
  
  loadingLogs.value = true
  activeLogs.value = []
  try {
    activeLogs.value = await fetchReviewLogs(row.id)
  } catch (err) {
    console.error(err)
  } finally {
    loadingLogs.value = false
  }
}

// Delete review trigger
const confirmDeleteReview = (row: any) => {
  selectedReviewForDelete.value = row
  isDeleteReviewModalOpen.value = true
}

const applyDeleteReview = async () => {
  if (selectedReviewForDelete.value) {
    try {
      await deleteReview(selectedReviewForDelete.value.id)
      isDeleteReviewModalOpen.value = false
      selectedReviewForDelete.value = null
    } catch (err) {
      console.error(err)
    }
  }
}

// Callbacks on moderation success
const onModerationSuccess = () => {
  if (actionModalType.value === 'recipe') {
    loadRecipes()
  } else {
    loadReviews()
  }
}

// Status translations & styling helper
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

// Table columns setup
const recipeColumns = [
  { accessorKey: 'title', header: 'Назва' },
  { accessorKey: 'user', header: 'Автор' },
  { accessorKey: 'category', header: 'Категорія' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'createdAt', header: 'Створено' },
  { accessorKey: 'actions', header: 'Дії' }
]

const reviewColumns = [
  { accessorKey: 'user', header: 'Автор відгуку' },
  { accessorKey: 'recipe', header: 'Рецепт' },
  { accessorKey: 'rating', header: 'Оцінка' },
  { accessorKey: 'text', header: 'Відгук' },
  { accessorKey: 'isPublished', header: 'Статус' },
  { accessorKey: 'createdAt', header: 'Створено' },
  { accessorKey: 'actions', header: 'Дії' }
]

// Tab buttons list
const tabItems = [
  { value: 'recipes', label: 'Рецепти', icon: 'i-lucide-book-open' },
  { value: 'reviews', label: 'Відгуки', icon: 'i-lucide-message-square' }
]
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center border-b pb-4 border-gray-100 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
          Модерація контенту
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Керуйте чергою перевірки рецептів та відгуків платформи.
        </p>
      </div>
      
      <UButton 
        icon="i-lucide-refresh-cw" 
        color="neutral" 
        variant="outline" 
        :loading="recipesLoading || reviewsLoading" 
        @click="activeTab === 'recipes' ? loadRecipes() : loadReviews()"
      >
        Оновити дані
      </UButton>
    </div>

    <!-- Main Navigation Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-800 gap-4">
      <button 
        v-for="tab in tabItems" 
        :key="tab.value" 
        @click="activeTab = tab.value as any"
        class="flex items-center gap-2 pb-3 px-2 font-heading font-bold text-sm border-b-2 transition-smooth cursor-pointer"
        :class="[
          activeTab === tab.value 
            ? 'border-coral-500 text-coral-500' 
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <UIcon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Alert details -->
    <UAlert v-if="recipesError && activeTab === 'recipes'" color="error" icon="i-lucide-alert-triangle" :title="recipesError" />
    <UAlert v-if="reviewsError && activeTab === 'reviews'" color="error" icon="i-lucide-alert-triangle" :title="reviewsError" />

    <!-- 1. Recipes Tab View -->
    <div v-if="activeTab === 'recipes'" class="space-y-4">
      <!-- Recipe Filters -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
        <UInput 
          v-model="recipeQuery" 
          icon="i-lucide-search" 
          placeholder="Пошук рецепту за назвою..." 
          class="w-full"
        />
        
        <USelect 
          v-model="recipeStatus" 
          :items="[
            { label: 'Модерація (Очікує)', value: 'moderation' },
            { label: 'Премодерація (AI)', value: 'premoderation' },
            { label: 'Опубліковані', value: 'public' },
            { label: 'Відхилені', value: 'rejected' },
            { label: 'Усі рецепти', value: 'all' }
          ]" 
          class="w-full"
        />

        <div class="flex items-center justify-end gap-2 text-sm text-gray-500 font-medium">
          <span>На сторінці:</span>
          <USelect v-model="recipeLimit" :items="[10, 25, 50]" class="w-20" />
        </div>
      </div>

      <!-- Recipes Table -->
      <UTable :data="recipes" :columns="recipeColumns" :loading="recipesLoading" class="w-full">
        <template #title-cell="{ row }">
          <NuxtLink :to="`/admin/recipes/${row.original.id}`" class="text-gray-900 dark:text-white hover:underline font-bold">
            {{ row.original.title }}
          </NuxtLink>
        </template>

        <template #user-cell="{ row }">
          <div class="flex flex-col" v-if="row.original.user">
            <NuxtLink 
              v-if="row.original.user.id" 
              :to="`/admin/users/${row.original.user.id}`" 
              class="font-bold text-gray-700 dark:text-gray-300 hover:underline text-left"
            >
              {{ row.original.user.displayname || 'Без імені' }}
            </NuxtLink>
            <span v-else class="font-bold text-gray-900 dark:text-white">{{ row.original.user.displayname || 'Без імені' }}</span>
            <span class="text-xs text-gray-500 font-mono">@{{ row.original.user.username }}</span>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #category-cell="{ row }">
          {{ categoryTranslations[row.original.category] || row.original.category }}
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status)">
            {{ getStatusLabel(row.original.status) }}
          </UBadge>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-gray-500 text-sm font-medium">{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            
            <!-- Logs button -->
            <UButton 
              icon="i-lucide-history" 
              color="neutral" 
              variant="outline"
              size="xs"
              @click="viewRecipeLogs(row.original)"
              class="cursor-pointer"
            >
              Логи
            </UButton>

            <!-- Moderate button -->
            <UButton 
              v-if="row.original.status === 'moderation' || row.original.status === 'premoderation'"
              icon="i-lucide-shield-alert" 
              color="primary" 
              size="xs"
              @click="openRecipeModeration(row.original)"
              class="cursor-pointer"
            >
              Модерувати
            </UButton>
          </div>
        </template>
      </UTable>

      <!-- Pagination -->
      <div v-if="recipesMeta && recipesMeta.totalPages > 1" class="flex justify-center mt-6">
        <AppPagination v-model:page="recipePage" :total="recipesMeta.totalItems" :items-per-page="recipeLimit" />
      </div>
    </div>

    <!-- 2. Reviews Tab View -->
    <div v-if="activeTab === 'reviews'" class="space-y-4">
      <!-- Review Filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
        <USelect 
          v-model="reviewPublishStatus" 
          :items="[
            { label: 'Усі відгуки', value: 'all' },
            { label: 'Неопубліковані (Відхилені премодерацією)', value: 'unpublished' },
            { label: 'Опубліковані', value: 'published' }
          ]" 
          class="w-full"
        />

        <div class="flex items-center justify-end gap-2 text-sm text-gray-500 font-medium">
          <span>На сторінці:</span>
          <USelect v-model="reviewLimit" :items="[10, 25, 50]" class="w-20" />
        </div>
      </div>

      <!-- Expandable Reviews Table -->
      <div class="overflow-x-auto rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse table-fixed">
          <thead class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50/70 dark:bg-gray-800/40 font-bold border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th scope="col" class="px-6 py-4 w-48">Автор відгуку</th>
              <th scope="col" class="px-6 py-4 w-40">Рецепт</th>
              <th scope="col" class="px-6 py-4 w-24">Оцінка</th>
              <th scope="col" class="px-6 py-4 w-80">Відгук</th>
              <th scope="col" class="px-6 py-4 w-36">Статус</th>
              <th scope="col" class="px-6 py-4 w-32">Створено</th>
              <th scope="col" class="px-6 py-4 w-80 text-right">Дії</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <!-- Loading State -->
            <tr v-if="reviewsLoading">
              <td colspan="7" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center justify-center gap-3">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Завантаження відгуків...</span>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="reviews.length === 0">
              <td colspan="7" class="px-6 py-16 text-center">
                <div class="flex flex-col items-center justify-center gap-2">
                  <UIcon name="i-lucide-message-square" class="w-10 h-10 text-gray-300 dark:text-gray-700" />
                  <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Немає відгуків</span>
                  <span class="text-xs text-gray-400">Відгуки з такими параметрами відсутні в базі даних.</span>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <template v-else v-for="review in reviews" :key="review.id">
              <!-- Main Row -->
              <tr 
                @click="toggleReviewExpand(review.id)" 
                class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 cursor-pointer transition-colors group"
                :class="[expandedReviewIds.includes(review.id) ? 'bg-gray-50/20 dark:bg-gray-800/5' : '']"
              >
                <!-- User -->
                <td class="px-6 py-4">
                  <div class="flex flex-col min-w-0" v-if="review.user" @click.stop>
                    <NuxtLink 
                      v-if="review.user.id" 
                      :to="`/admin/users/${review.user.id}`" 
                      class="font-bold text-gray-700 dark:text-gray-300 hover:underline text-left truncate"
                    >
                      {{ review.user.displayname || 'Без імені' }}
                    </NuxtLink>
                    <span v-else class="font-bold text-gray-900 dark:text-white truncate">
                      {{ review.user.displayname || 'Без імені' }}
                    </span>
                    <span class="text-xs text-gray-500 truncate">@{{ review.user.username }}</span>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>

                <!-- Recipe -->
                <td class="px-6 py-4">
                  <div class="flex flex-col min-w-0" v-if="review.recipe" @click.stop>
                    <NuxtLink 
                      :to="`/admin/recipes/${review.recipe.id}`" 
                      class="text-gray-900 dark:text-white hover:underline font-bold text-sm truncate"
                    >
                      {{ review.recipe.title }}
                    </NuxtLink>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>

                <!-- Rating -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1">
                    <span class="font-bold text-gray-900 dark:text-white">{{ review.rating }}</span>
                    <UIcon name="i-lucide-star" class="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                </td>

                <!-- Text -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                      {{ review.text || 'Немає тексту' }}
                    </p>
                    <UIcon 
                      :name="expandedReviewIds.includes(review.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" 
                      class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors shrink-0" 
                    />
                  </div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4">
                  <UBadge :color="review.isPublished ? 'success' : 'warning'" variant="subtle" class="rounded-lg font-bold">
                    {{ review.isPublished ? 'Опубліковано' : 'Неопубліковано' }}
                  </UBadge>
                </td>

                <!-- Created At -->
                <td class="px-6 py-4">
                  <span class="text-gray-500 text-sm font-medium whitespace-nowrap">{{ formatDate(review.createdAt) }}</span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-2">
                    <!-- Toggle Expand/Moderate button -->
                    <UButton 
                      :icon="expandedReviewIds.includes(review.id) ? 'i-lucide-chevron-up' : 'i-lucide-shield-alert'" 
                      :color="expandedReviewIds.includes(review.id) ? 'neutral' : 'primary'" 
                      :variant="expandedReviewIds.includes(review.id) ? 'outline' : 'solid'"
                      size="xs"
                      @click="toggleReviewExpand(review.id)"
                      class="cursor-pointer font-bold rounded-lg"
                    >
                      {{ expandedReviewIds.includes(review.id) ? 'Згорнути' : 'Модерувати' }}
                    </UButton>
                    
                    <!-- Logs button -->
                    <UButton 
                      icon="i-lucide-history" 
                      color="neutral" 
                      variant="outline"
                      size="xs"
                      @click="viewReviewLogs(review)"
                      class="cursor-pointer font-bold rounded-lg"
                    >
                      Логи
                    </UButton>

                    <!-- Delete button -->
                    <UButton 
                      icon="i-lucide-trash-2" 
                      color="error" 
                      variant="ghost"
                      size="xs"
                      @click="confirmDeleteReview(review)"
                      class="cursor-pointer rounded-lg"
                    />
                  </div>
                </td>
              </tr>

              <!-- Expandable Row -->
              <tr v-if="expandedReviewIds.includes(review.id)" class="bg-gray-50/40 dark:bg-gray-800/10">
                <td colspan="7" class="px-6 py-4">
                  <div class="flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-900/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm animate-fade-in">
                    <!-- Image -->
                    <div v-if="review.imageId" class="w-full md:w-60 h-40 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-950 shrink-0 flex justify-center items-center border border-gray-100 dark:border-gray-800">
                      <img 
                        :src="getUrl(review.imageId, { width: 400, height: 300, crop: 'fit' })" 
                        alt="Зображення відгуку" 
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <!-- Details -->
                    <div class="flex-1 space-y-3 min-w-0">
                      <div class="flex items-center justify-between gap-4">
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-bold font-heading text-smak-neutral-800 dark:text-smak-neutral-200">
                            Повний текст відгуку від @{{ review.user?.username }}
                          </h4>
                        </div>
                        <div class="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full text-xs font-black">
                          <UIcon name="i-lucide-star" class="w-3.5 h-3.5 fill-current" />
                          <span>{{ review.rating }}</span>
                        </div>
                      </div>
                      
                      <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap select-all selection:bg-coral-100 dark:selection:bg-coral-950">
                        {{ review.text || 'Немає текстового вмісту' }}
                      </p>

                      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-semibold pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span>ID відгуку: <span class="font-mono text-gray-500">{{ review.id }}</span></span>
                        <span>•</span>
                        <span>Рецепт: <NuxtLink :to="`/admin/recipes/${review.recipe?.id}`" class="text-primary-500 hover:underline font-bold" @click.stop>{{ review.recipe?.title }}</NuxtLink></span>
                        <span>•</span>
                        <span>Створено: {{ formatDate(review.createdAt) }}</span>
                      </div>
                    </div>

                    <!-- Direct Moderation Controls Inside Expandable Row -->
                    <div class="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between space-y-4" @click.stop>
                      <div class="space-y-4">
                        <h4 class="text-xs uppercase tracking-wider font-bold font-heading text-smak-neutral-400 dark:text-smak-neutral-500">
                          Рішення модерації:
                        </h4>
                        
                        <!-- Decision Buttons -->
                        <div class="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-smooth cursor-pointer text-xs font-bold"
                            :class="[
                              reviewDecisions[review.id] === 'approved' 
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'
                            ]"
                            @click="reviewDecisions[review.id] = 'approved'; reviewValidationErrors[review.id] = null"
                          >
                            <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                            <span>Схвалити</span>
                          </button>

                          <button 
                            type="button"
                            class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-smooth cursor-pointer text-xs font-bold"
                            :class="[
                              reviewDecisions[review.id] === 'rejected' 
                                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 shadow-sm' 
                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'
                            ]"
                            @click="reviewDecisions[review.id] = 'rejected'; reviewValidationErrors[review.id] = null"
                          >
                            <UIcon name="i-lucide-x-circle" class="w-4 h-4" />
                            <span>Відхилити</span>
                          </button>
                        </div>

                        <!-- Comment Field -->
                        <div class="space-y-1">
                          <div class="flex justify-between items-center text-xs">
                            <span class="text-xs font-bold font-heading text-smak-neutral-500 dark:text-smak-neutral-400">Коментар / Причина:</span>
                            <span v-if="reviewDecisions[review.id] === 'rejected'" class="text-rose-500 font-bold">Обов'язково</span>
                          </div>
                          <UTextarea 
                            v-model="reviewReasons[review.id]" 
                            placeholder="Коментар модератора..." 
                            :rows="2" 
                            size="xs"
                            class="w-full text-xs"
                          />
                          <p v-if="reviewValidationErrors[review.id]" class="text-[10px] font-bold text-rose-500 dark:text-rose-400 flex items-center gap-0.5 mt-0.5">
                            <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
                            {{ reviewValidationErrors[review.id] }}
                          </p>
                        </div>
                      </div>

                      <!-- Submit Button -->
                      <UButton 
                        label="Зберегти рішення" 
                        color="primary" 
                        size="xs"
                        block
                        class="cursor-pointer font-bold rounded-xl py-2 shadow-md shadow-coral-500/10"
                        :loading="reviewSubmittingIds[review.id]"
                        @click="submitRowModeration(review.id)"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="reviewsMeta && reviewsMeta.totalPages > 1" class="flex justify-center mt-6">
        <AppPagination v-model:page="reviewPage" :total="reviewsMeta.totalItems" :items-per-page="reviewLimit" />
      </div>
    </div>

    <!-- Active Moderation Decision Modal -->
    <ModerationActionModal
      v-model:open="isActionModalOpen"
      :id="selectedIdForAction"
      :type="actionModalType"
      :title="actionModalTitle"
      :itemData="selectedItemForAction"
      @success="onModerationSuccess"
    />

    <!-- Moderation Logs Timeline Modal -->
    <UModal 
      v-model:open="isLogsModalOpen" 
      :ui="{ content: 'sm:max-w-xl rounded-3xl' }"
    >
      <template #content>
        <div class="p-6 sm:p-8 space-y-6 text-left">
          <div class="flex justify-between items-start gap-4">
            <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              {{ logsModalTitle }}
            </h3>
            <UButton 
              icon="i-lucide-x" 
              color="neutral" 
              variant="ghost" 
              class="rounded-full h-8 w-8 p-0 cursor-pointer" 
              @click="isLogsModalOpen = false" 
            />
          </div>
          <div class="max-h-[60vh] overflow-y-auto pr-2">
            <ModerationLogTimeline :logs="activeLogs" :loading="loadingLogs" />
          </div>
          <div class="flex justify-end pt-2">
            <UButton 
              label="Закрити" 
              color="neutral" 
              variant="outline" 
              class="rounded-xl font-bold px-6 py-2 cursor-pointer" 
              @click="isLogsModalOpen = false" 
            />
          </div>
        </div>
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
