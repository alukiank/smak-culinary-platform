<!--
@page-docs
title: My Recipes
description: User's personal recipe library page. Allows managing published recipes, drafts, archived items, and items awaiting moderation.
features:
  - Filter recipes: tabs for viewing all, public, drafts, pre-moderation, rejected, or archived recipes.
  - Search: search recipes by name using a search bar.
  - Recipe management: delete recipes with confirmation modal, edit drafts, move recipes to drafts, publish (submit to moderation), archive and unarchive recipes.
-->

<script setup lang="ts">
import type { RecipeResponseDto, RecipeStatus } from '~/types/recipe'
import { SharedConfirmModal } from '#components'

definePageMeta({
  middleware: 'auth',
  layout: 'profile'
})

useSeoMeta({
  title: 'Smak | Мої рецепти',
  description: 'Керуйте вашими кулінарними шедеврами та чернетками.'
})

const { user, initAuth } = useAuth()
const { 
  recipes, 
  loading, 
  error, 
  meta, 
  fetchRecipes, 
  deleteRecipe,
  publishRecipe,
  draftRecipe,
  archiveRecipe,
  unarchiveRecipe
} = useRecipes('profile')

const toast = useToast()
const router = useRouter()
const overlay = useOverlay()

// Filters
const search = ref('')
const activeTab = ref('all')
const page = ref(1)

const tabs = [
  { label: 'Усі', value: 'all', status: undefined },
  { label: 'Опубліковані', value: 'public', status: 'public' as RecipeStatus },
  { label: 'Чернетки', value: 'draft', status: 'draft' as RecipeStatus },
  { label: 'На перевірці', value: 'premoderation', status: 'premoderation' as RecipeStatus },
  { label: 'Відхилено', value: 'rejected', status: 'rejected' as RecipeStatus },
  { label: 'В архіві', value: 'archived', status: 'archived' as RecipeStatus }
]

const currentStatus = computed(() => tabs.find(t => t.value === activeTab.value)?.status)

const { pending, refresh, error: fetchError } = await useAsyncData(
  'my-recipes',
  async () => {
    if (!user.value?.id) {
      await initAuth()
    }
    
    if (!user.value?.id) return []
    
    await fetchRecipes({
      userId: user.value.id,
      status: currentStatus.value,
      query: search.value.trim() || undefined,
      page: page.value,
      limit: 10
    })
    
    return recipes.value
  },
  {
    watch: [activeTab, page, () => user.value?.id],
    immediate: true
  }
)

// Handle skeleton delay to avoid flicker on fast loads
const showSkeleton = ref(false)
let skeletonTimeout: any = null

watch(pending, (isPending) => {
  if (isPending) {
    // Only show skeleton if loading takes more than 200ms
    skeletonTimeout = setTimeout(() => {
      showSkeleton.value = true
    }, 200)
  } else {
    if (skeletonTimeout) clearTimeout(skeletonTimeout)
    showSkeleton.value = false
  }
}, { immediate: true })

const handleSearch = () => {
  page.value = 1
  refresh()
}

// Reset page on tab change
watch(activeTab, () => {
  page.value = 1
})

const handleEdit = (recipe: RecipeResponseDto) => {
  router.push(`/recipes/edit/${recipe.id}`)
}

const confirmDelete = (id: string) => {
  overlay.create(SharedConfirmModal, {
    props: {
      title: 'Видалити рецепт?',
      description: 'Ця дія є незворотною. Рецепт буде повністю видалено з системи разом із усіма пов\'язаними даними.',
      confirmLabel: 'Видалити назавжди',
      onConfirm: async () => {
        await handleDelete(id)
      }
    }
  }).open()
}

const handleDelete = async (id: string) => {
  try {
    await deleteRecipe(id)
    toast.add({
      title: 'Успішно',
      description: 'Рецепт видалено назавжди.',
      color: 'success'
    })
    refresh()
  } catch (e: any) {
    toast.add({
      title: 'Помилка',
      description: e.message || 'Не вдалося видалити рецепт.',
      color: 'error'
    })
  }
}

const handleArchive = async (id: string) => {
  try {
    await archiveRecipe(id)
    toast.add({
      title: 'Успішно',
      description: 'Рецепт перенесено до архіву.',
      color: 'warning'
    })
    if (currentStatus.value && currentStatus.value !== 'archived') {
      recipes.value = recipes.value.filter(r => r.id !== id)
    }
  } catch (e: any) {
    toast.add({
      title: 'Помилка',
      description: 'Не вдалося архівувати рецепт.',
      color: 'error'
    })
  }
}

const handleUnarchive = async (id: string) => {
  try {
    await unarchiveRecipe(id)
    toast.add({
      title: 'Успішно',
      description: 'Рецепт повернено до чернеток.',
      color: 'success'
    })
    if (currentStatus.value === 'archived') {
      recipes.value = recipes.value.filter(r => r.id !== id)
    }
  } catch (e: any) {
    toast.add({
      title: 'Помилка',
      description: 'Не вдалося розархівувати рецепт.',
      color: 'error'
    })
  }
}

const handleDraft = async (id: string) => {
  try {
    await draftRecipe(id)
    toast.add({
      title: 'Успішно',
      description: 'Рецепт переведено у статус чернетки.',
      color: 'neutral'
    })
    if (currentStatus.value && currentStatus.value !== 'draft') {
      recipes.value = recipes.value.filter(r => r.id !== id)
    }
  } catch (e: any) {
    toast.add({
      title: 'Помилка',
      description: 'Не вдалося змінити статус.',
      color: 'error'
    })
  }
}

const handlePublish = async (id: string) => {
  try {
    await publishRecipe(id)
    toast.add({
      title: 'Успішно',
      description: 'Рецепт відправлено на модерацію.',
      color: 'success'
    })
    if (currentStatus.value && currentStatus.value !== 'premoderation') {
      recipes.value = recipes.value.filter(r => r.id !== id)
    }
  } catch (e: any) {
    toast.add({
      title: 'Помилка',
      description: 'Не вдалося опублікувати рецепт.',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-8">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black font-heading text-smak-neutral-900 dark:text-white mb-1 sm:mb-2">
          Мої рецепти
        </h1>
        <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
          Тут зібрані всі ваші кулінарні шедеври, чернетки та ідеї.
        </p>
      </div>

      <UButton 
        to="/recipes/create" 
        size="lg" 
        class="hidden sm:inline-flex shrink-0 rounded-full font-bold px-7 py-3 bg-coral-500 hover:bg-coral-600 text-white shadow-md shadow-coral-500/25 hover:scale-105 transition-all cursor-pointer border-0 items-center justify-center gap-2"
      >
        <UIcon name="i-lucide-plus" class="w-5 h-5" />
        Створити рецепт
      </UButton>
    </div>

    <!-- Floating Action Button for Mobile -->
    <NuxtLink
      to="/recipes/create"
      class="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-coral-500 hover:bg-coral-600 text-white shadow-xl shadow-coral-500/40 hover:scale-105 transition-all cursor-pointer flex items-center justify-center border-0"
      aria-label="Створити рецепт"
    >
      <UIcon name="i-lucide-plus" class="w-7 h-7" />
    </NuxtLink>

    <!-- Filters & Tabs Bar (Categories under search input on mobile) -->
    <div class="flex flex-col-reverse lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8">
      <!-- Tabs list with outline pill buttons -->
      <div class="flex items-center gap-2 sm:gap-2.5 overflow-x-auto custom-scrollbar pb-2 lg:pb-0">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          class="h-10 px-4 sm:px-5 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center shrink-0 border bg-transparent"
          :class="[
            activeTab === t.value
              ? 'border-coral-500 text-coral-500 shadow-xs'
              : 'border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-400 hover:border-coral-500 hover:text-coral-500'
          ]"
          @click="activeTab = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Search Input -->
      <div class="lg:w-80 w-full shrink-0">
        <SharedAppSearchInput 
          v-model="search" 
          @search="handleSearch" 
          placeholder="Пошук за назвою..." 
        />
      </div>
    </div>

    <!-- Recipes List -->
    <div class="min-h-100">
      <div v-if="showSkeleton && recipes.length === 0" class="space-y-6">
        <RecipeCardMyRecipeSkeleton v-for="i in 3" :key="i" />
      </div>

      <div v-else-if="fetchError" class="flex flex-col items-center justify-center py-20 text-center">
        <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-rose-500 mb-4" />
        <h2 class="text-xl font-bold text-smak-neutral-900 dark:text-white mb-2">Помилка завантаження</h2>
        <p class="text-smak-neutral-500 dark:text-smak-neutral-400 mb-6">Не вдалося отримати ваші рецепти.</p>
        <UButton color="primary" @click="() => refresh()">Спробувати знову</UButton>
      </div>

      <div v-else-if="recipes.length > 0" class="space-y-6">
        <RecipeCardMyRecipeCard 
          v-for="recipe in recipes" 
          :key="recipe.id" 
          :recipe="recipe"
          @edit="handleEdit"
          @delete="confirmDelete"
          @archive="handleArchive"
          @unarchive="handleUnarchive"
          @draft="handleDraft"
          @publish="handlePublish"
        />

        <!-- Pagination -->
        <div v-if="meta && meta.totalPages > 1" class="flex justify-center mt-12">
          <SharedAppPagination 
            v-model:page="page" 
            :total="meta.totalItems" 
            :items-per-page="meta.itemsPerPage"
          />
        </div>
      </div>

      <!-- Empty State (Only show when not loading and no recipes found) -->
      <div v-else-if="!pending" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-24 h-24 bg-coral-50 dark:bg-coral-950/20 rounded-full flex items-center justify-center text-coral-500 mb-6">
          <UIcon name="i-lucide-utensils-crossed" class="w-12 h-12" />
        </div>
        <h2 class="text-xl sm:text-2xl font-black font-heading text-smak-neutral-900 dark:text-white mb-2">
          Рецептів не знайдено
        </h2>
        <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-sm mb-6">
          Схоже, у вас ще немає рецептів у цьому розділі. Створіть свій перший кулінарний шедевр вже зараз!
        </p>

      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0; /* smak-neutral-200 equivalent */
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155; /* smak-neutral-700 equivalent */
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
