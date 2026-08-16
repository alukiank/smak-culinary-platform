<!--
@page-docs
title: Recipe Management (Admin)
description: Admin panel section for managing all recipes on the SMAK platform.
features:
  - View all recipes on the platform with paginated table display.
  - Search recipes by title and filter by status or category.
  - View details of a specific recipe or open it in edit mode.
  - Change status of a recipe manually (draft, premoderation, moderation, public, rejected, archived).
  - Delete any recipe with confirmation dialog.
  - Filter recipes by specific author/user ID.
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | Recipe Management (Admin)'
})
import { ref, onMounted, watch } from 'vue'
import { useAdminRecipes } from '~/composables/useAdminRecipes'
import type { RecipeStatus, RecipeCategory } from '~/types/recipe'
import { statusTranslations, categoryTranslations, formatDate } from '~/utils/formatters'
import AppPagination from '~/components/shared/AppPagination.vue'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin'
})

const { recipes, loading, error, meta, fetchRecipes, updateStatus, deleteRecipe } = useAdminRecipes()

const columns = [
  { 
    accessorKey: 'title', 
    header: 'Назва',
    meta: { class: { th: 'w-64 min-w-[16rem]', td: 'w-64 min-w-[16rem]' } }
  },
  { 
    accessorKey: 'user', 
    header: 'Автор',
    meta: { class: { th: 'w-48 min-w-[12rem]', td: 'w-48 min-w-[12rem]' } }
  },
  { 
    accessorKey: 'category', 
    header: 'Категорія',
    meta: { class: { th: 'w-40 min-w-[10rem]', td: 'w-40 min-w-[10rem]' } }
  },
  { 
    accessorKey: 'status', 
    header: 'Статус',
    meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } }
  },
  { 
    accessorKey: 'createdAt', 
    header: 'Створено',
    meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } }
  },
  { 
    accessorKey: 'actions', 
    header: 'Дії',
    meta: { class: { th: 'w-24 min-w-[6rem]', td: 'w-24 min-w-[6rem]' } }
  }
]

const route = useRoute()
const router = useRouter()

const page = ref(Number(route.query.page) || 1)
const limit = ref(Number(route.query.limit) || 10)
const query = ref((route.query.query as string) || '')
const selectedStatus = ref<RecipeStatus | 'all'>((route.query.status as RecipeStatus) || 'all')
const selectedCategory = ref<RecipeCategory | 'all'>((route.query.category as RecipeCategory) || 'all')

const userId = ref((route.query.userId as string) || '')
const authorName = ref((route.query.author as string) || '')

const statuses = Object.entries(statusTranslations).map(([value, label]) => ({ label, value }))

const statusOptions = [
  { label: 'Всі статуси', value: 'all' },
  ...statuses
]

const categoryOptions = [
  { label: 'Всі категорії', value: 'all' },
  ...Object.entries(categoryTranslations).map(([value, label]) => ({ label, value }))
]

const loadRecipes = () => {
  fetchRecipes({
    page: page.value,
    limit: limit.value,
    query: query.value || undefined,
    status: selectedStatus.value === 'all' ? undefined : selectedStatus.value as RecipeStatus,
    category: selectedCategory.value === 'all' ? undefined : selectedCategory.value as RecipeCategory,
    userId: userId.value || undefined
  })
}

onMounted(() => {
  loadRecipes()
})

watch([page, limit, selectedStatus, selectedCategory], () => {
  loadRecipes()
})

// Debounce search
let searchTimeout: NodeJS.Timeout
watch(query, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1 // Reset to first page on search
    loadRecipes()
  }, 500)
})

watch(() => route.query.userId, (newUserId) => {
  userId.value = (newUserId as string) || ''
  authorName.value = (route.query.author as string) || ''
  loadRecipes()
})

const clearUserFilter = () => {
  userId.value = ''
  authorName.value = ''
  router.push({ query: { ...route.query, userId: undefined, author: undefined } })
  loadRecipes()
}

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

const handleStatusChange = async (recipeId: string, newStatus: RecipeStatus) => {
  try {
    await updateStatus(recipeId, newStatus)
  } catch (err) {
    console.error('Failed to update status', err)
  }
}

const handleDelete = async (recipeId: string) => {
  if (confirm('Ви впевнені, що хочете видалити цей рецепт? Ця дія незворотна.')) {
    try {
      await deleteRecipe(recipeId)
    } catch (err) {
      console.error('Failed to delete recipe', err)
    }
  }
}

const isStatusModalOpen = ref(false)
const selectedRecipeForStatus = ref<any>(null)
const newStatus = ref<RecipeStatus | ''>('')



const isDeleteModalOpen = ref(false)
const selectedRecipeForDelete = ref<any>(null)

const getDropdownItems = (row: any) => [
  [
    {
      label: 'Переглянути',
      icon: 'i-lucide-eye',
      to: `/admin/recipes/${row.id}` 
    },
    {
      label: 'Редагувати',
      icon: 'i-lucide-pencil',
      to: `/admin/recipes/edit/${row.id}` 
    }
  ],
  [
    {
      label: 'Змінити статус',
      icon: 'i-lucide-refresh-cw',
      onSelect: () => {
        selectedRecipeForStatus.value = row
        newStatus.value = row.status
        setTimeout(() => {
          isStatusModalOpen.value = true
        }, 50)
      }
    }
  ],
  [
    {
      label: 'Видалити',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        selectedRecipeForDelete.value = row
        setTimeout(() => {
          isDeleteModalOpen.value = true
        }, 50)
      }
    }
  ]
] as any[][]

const applyStatusChange = async () => {
  if (selectedRecipeForStatus.value && newStatus.value) {
    await handleStatusChange(selectedRecipeForStatus.value.id, newStatus.value as RecipeStatus)
    isStatusModalOpen.value = false
  }
}

const confirmDelete = async () => {
  if (selectedRecipeForDelete.value) {
    try {
      await deleteRecipe(selectedRecipeForDelete.value.id)
      isDeleteModalOpen.value = false
    } catch (err) {
      console.error('Failed to delete recipe', err)
    }
  }
}

const getRowUser = (row: any) => row.user
const getRowCreatedAt = (row: any) => row.createdAt
const getRowStatus = (row: any) => row.status as RecipeStatus
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Управління рецептами</h1>
      <UButton icon="i-lucide-refresh-cw" color="neutral" @click="loadRecipes" :loading="loading">
        Оновити
      </UButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-4">
      <div v-if="meta" class="text-sm text-gray-500">
        Всього знайдено: <span class="font-bold text-gray-900 dark:text-white">{{ meta.totalItems }}</span> рецептів
      </div>
      
      <!-- Active Author Filter Badge -->
      <UBadge 
        v-if="userId" 
        color="primary" 
        variant="subtle" 
        size="md"
        class="rounded-xl font-bold flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 animate-fade-in"
      >
        <span>Автор: {{ authorName || 'Користувач' }}</span>
        <UButton 
          icon="i-lucide-x" 
          color="primary" 
          variant="ghost" 
          size="xs" 
          class="rounded-full h-5 w-5 p-0 hover:bg-primary-100 dark:hover:bg-primary-950/40 cursor-pointer"
          @click="clearUserFilter"
        />
      </UBadge>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UInput v-model="query" icon="i-lucide-search" placeholder="Пошук за назвою..." />
      
      <USelect v-model="selectedStatus" :items="statusOptions" />

      <USelect v-model="selectedCategory" :items="categoryOptions" />
      
      <div class="flex items-center justify-end gap-2">
        <span class="text-sm text-gray-500">На сторінці:</span>
        <USelect v-model="limit" :items="[10, 20, 50]" class="w-20" />
      </div>
    </div>

    <UAlert v-if="error" color="error" icon="i-lucide-alert-triangle" :title="error" class="mb-6" />
    
    <!-- Table -->
    <UTable :data="recipes" :columns="columns" :loading="loading" class="w-full table-fixed">
      <template #title-cell="{ row }">
        <NuxtLink :to="`/admin/recipes/${row.original.id}`" class="text-gray-700 dark:text-gray-300 hover:underline font-medium">
          {{ row.original.title }}
        </NuxtLink>
      </template>

      <template #user-cell="{ row }">
        <div class="flex flex-col" v-if="row.original.user">
          <NuxtLink v-if="row.original.user.id" :to="`/admin/users/${row.original.user.id}`" class="text-gray-700 dark:text-gray-300 hover:underline font-medium">
            {{ row.original.user.displayname || 'Без імені' }}
          </NuxtLink>
          <span v-else class="font-medium text-gray-700 dark:text-gray-300">{{ row.original.user.displayname || 'Без імені' }}</span>
          <span class="text-xs text-gray-500">{{ row.original.user.email }}</span>
        </div>
        <span v-else class="text-gray-500">-</span>
      </template>

      <template #status-cell="{ row }">
        <UBadge :color="getStatusColor(row.original.status)">
          {{ getStatusLabel(row.original.status) }}
        </UBadge>
      </template>

      <template #createdAt-cell="{ row }">
        {{ formatDate(row.original.createdAt) }}
      </template>

      <template #actions-cell="{ row }">
        <UDropdownMenu :items="getDropdownItems(row.original)">
          <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" />
        </UDropdownMenu>
      </template>
    </UTable>

    <!-- Pagination -->
    <div v-if="meta" class="flex justify-center mt-6 w-full">
      <AppPagination v-model:page="page" :total="meta.totalItems" :items-per-page="limit" />
    </div>

<UModal 
  v-model:open="isStatusModalOpen" 
  title="Змінити статус рецепту"
>
  <template #body>
    <p class="mb-4 text-gray-700 dark:text-gray-300">
      Рецепт: <span class="font-medium text-gray-900 dark:text-white">{{ selectedRecipeForStatus?.title }}</span>
    </p>
    
    <USelect v-model="newStatus" :items="statuses" class="w-full" />
  </template>

  <template #footer>
    <div class="flex justify-end gap-3">
      <UButton color="neutral" variant="ghost" @click="isStatusModalOpen = false">
        Скасувати
      </UButton>
      <UButton color="primary" @click="applyStatusChange">
        Зберегти
      </UButton>
    </div>
  </template>
</UModal>

    <!-- Delete Confirmation Modal -->
    <UModal 
      v-model:open="isDeleteModalOpen" 
      :ui="{ content: 'sm:max-w-md rounded-3xl' }"
    >
      <template #content>
        <div class="p-6 sm:p-8 space-y-6 text-left">
          <div class="space-y-2">
            <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              Видалити рецепт?
            </h3>
            <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed">
              Ви впевнені, що хочете видалити цей рецепт? Ця дія незворотна.
            </p>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <UButton 
              label="Скасувати" 
              color="neutral" 
              variant="ghost" 
              class="flex-1 justify-center rounded-xl py-3 font-bold cursor-pointer"
              @click="isDeleteModalOpen = false" 
            />
            <UButton 
              label="Видалити" 
              color="error" 
              variant="solid"
              class="flex-1 justify-center rounded-xl py-3 font-bold shadow-lg shadow-rose-500/20 cursor-pointer"
              @click="confirmDelete" 
            />
          </div>
        </div>
      </template>
    </UModal>

  </div>
</template>
