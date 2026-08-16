<!--
@page-docs
title: Recipe search and catalog
description: The main catalog of dishes of the SMAK platform. Allows you to search for recipes in natural language (semantic vector search pgvector) and apply advanced culinary and dietary filters.
features:
  - Intelligent semantic search: AI analyzes the semantic content of the search query instead of simple word search. Results are sorted by semantic similarity or novelty.
  - Advanced filtering: filtering by dish category, cuisine country, difficulty level, cooking time, health score, minimum rating from reviews.
  - Dietary restrictions and allergens: quick filters for vegan, vegetarian, gluten-free, lactose-free, nut-free, halal and kosher dishes.
  - Visual badges of active filters: quick removal of any filter with one click.
  - Pagination of search results with an indicator of the total number of found dishes.
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipes } from '~/composables/useRecipes'
import RecipeCard from '~/components/recipe/card/RecipeCard.vue'
import RecipeFilterPanel, { type RecipeFilters } from '~/components/recipe/filter/RecipeFilterPanel.vue'
import RecipeGridSkeleton from '~/components/recipe/card/RecipeGridSkeleton.vue'
import AppPagination from '~/components/shared/AppPagination.vue'
import AppSearchInput from '~/components/shared/AppSearchInput.vue'
import { 
  categoryTranslations, 
  cuisineTranslations, 
  difficultyTranslations,
  cookSpeedTranslations
} from '~/utils/formatters'
import { useUser } from '~/composables/useUser'

const route = useRoute()
const router = useRouter()
const { recipes, meta, loading, error, fetchRecipes } = useRecipes('catalog')
const { user, getRestrictions } = useUser()

// Search input model
const searchQuery = ref('')
const isMobileFilterOpen = ref(false)
const isInitialLoad = ref(true)

const getDefaultDietFilter = (key: string): boolean => {
  if (!user.value?.dietary) return false
  return user.value.dietary.some(d => {
    const clean = d.toLowerCase().replace(/[-_]/g, '')
    if (key === 'isVegan' && clean.includes('vegan')) return true
    if (key === 'isVegetarian' && clean.includes('vegetarian')) return true
    if (key === 'isGluten_free' && clean.includes('gluten')) return true
    if (key === 'isHalal' && clean.includes('halal')) return true
    if (key === 'isKosher' && clean.includes('kosher')) return true
    if (key === 'isDairyFree' && clean.includes('dairy')) return true
    if (key === 'isNutFree' && clean.includes('nut')) return true
    return false
  })
}

// Active filters state
const filters = ref<RecipeFilters>({
  category: undefined,
  cuisineList: [],
  difficulty: undefined,
  cookSpeed: undefined,
  maxCookTime: 180, // Initialize to maximum number (180) to make sliders reactively bindable
  minHealthScore: 0, // Initialize to minimum number (0) to make sliders reactively bindable
  minRating: undefined,
  isVegetarian: getDefaultDietFilter('isVegetarian'),
  isVegan: getDefaultDietFilter('isVegan'),
  isGluten_free: getDefaultDietFilter('isGluten_free'),
  isHalal: getDefaultDietFilter('isHalal'),
  isKosher: getDefaultDietFilter('isKosher'),
  isDairyFree: getDefaultDietFilter('isDairyFree'),
  isNutFree: getDefaultDietFilter('isNutFree')
})

// Current page model
const currentPage = ref(1)
const itemsPerPage = ref(12) // We can fetch 12 recipes per page (nice grid divisibility for 2, 3, 4 cols)

// Parse route query parameters to set initial state
const parseQueryToState = () => {
  const q = route.query
  
  searchQuery.value = q.query ? String(q.query) : ''
  currentPage.value = q.page ? Number(q.page) : 1
  
  const newFilters: RecipeFilters = {
    category: q.category ? String(q.category) : undefined,
    cuisineList: q.cuisineList ? String(q.cuisineList).split(',') : [],
    difficulty: (q.difficulty as any) || undefined,
    cookSpeed: (q.cookSpeed as any) || undefined,
    maxCookTime: q.maxCookTime ? Number(q.maxCookTime) : 180,
    minHealthScore: q.minHealthScore ? Number(q.minHealthScore) : 0,
    minRating: q.minRating ? Number(q.minRating) : undefined,
    isVegetarian: q.isVegetarian !== undefined ? q.isVegetarian === 'true' : getDefaultDietFilter('isVegetarian'),
    isVegan: q.isVegan !== undefined ? q.isVegan === 'true' : getDefaultDietFilter('isVegan'),
    isGluten_free: q.isGluten_free !== undefined ? q.isGluten_free === 'true' : getDefaultDietFilter('isGluten_free'),
    isHalal: q.isHalal !== undefined ? q.isHalal === 'true' : getDefaultDietFilter('isHalal'),
    isKosher: q.isKosher !== undefined ? q.isKosher === 'true' : getDefaultDietFilter('isKosher'),
    isDairyFree: q.isDairyFree !== undefined ? q.isDairyFree === 'true' : getDefaultDietFilter('isDairyFree'),
    isNutFree: q.isNutFree !== undefined ? q.isNutFree === 'true' : getDefaultDietFilter('isNutFree')
  }
  
  filters.value = newFilters
}

// Convert state to API parameters
const buildApiParams = () => {
  const params: any = {
    page: currentPage.value,
    limit: itemsPerPage.value
  }
  
  if (searchQuery.value.trim()) {
    params.query = searchQuery.value.trim()
  }
  
  const f = filters.value
  if (f.category) params.category = f.category
  if (f.cuisineList && f.cuisineList.length > 0) {
    params.cuisineList = f.cuisineList.length === 1 
      ? [f.cuisineList[0], f.cuisineList[0]] 
      : f.cuisineList
  }
  if (f.difficulty) params.difficulty = f.difficulty
  if (f.cookSpeed) params.cookSpeed = f.cookSpeed
  if (f.maxCookTime !== undefined && f.maxCookTime < 180) {
    params.maxCookTime = f.maxCookTime
  }
  if (f.minHealthScore !== undefined && f.minHealthScore > 0) {
    params.minHealthScore = f.minHealthScore
  }
  if (f.minRating !== undefined && f.minRating > 0) {
    params.minRating = f.minRating
  }
  
  // Boolean filters
  const booleans = ['isVegetarian', 'isVegan', 'isGluten_free', 'isHalal', 'isKosher', 'isDairyFree', 'isNutFree']
  booleans.forEach(b => {
    if ((f as any)[b]) {
      params[b] = true
    }
  })
  
  return params
}

// Update URL route based on state (making it shareable/linkable)
const syncStateToUrl = () => {
  const queryParams: Record<string, any> = {}
  
  if (searchQuery.value.trim()) {
    queryParams.query = searchQuery.value.trim()
  }
  
  if (currentPage.value > 1) {
    queryParams.page = currentPage.value
  }
  
  const f = filters.value
  if (f.category) queryParams.category = f.category
  if (f.cuisineList && f.cuisineList.length > 0) {
    queryParams.cuisineList = f.cuisineList.join(',')
  }
  if (f.difficulty) queryParams.difficulty = f.difficulty
  if (f.cookSpeed) queryParams.cookSpeed = f.cookSpeed
  if (f.maxCookTime !== undefined && f.maxCookTime < 180) {
    queryParams.maxCookTime = f.maxCookTime
  }
  if (f.minHealthScore !== undefined && f.minHealthScore > 0) {
    queryParams.minHealthScore = f.minHealthScore
  }
  if (f.minRating !== undefined && f.minRating > 0) {
    queryParams.minRating = f.minRating
  }
  
  const booleans = ['isVegetarian', 'isVegan', 'isGluten_free', 'isHalal', 'isKosher', 'isDairyFree', 'isNutFree']
  booleans.forEach(b => {
    const val = (f as any)[b]
    const def = getDefaultDietFilter(b)
    if (val !== def) {
      queryParams[b] = val ? 'true' : 'false'
    }
  })
  
  router.push({ path: '/recipes', query: queryParams })
}

// Perform recipes search query
const executeSearch = async () => {
  const params = buildApiParams()
  await fetchRecipes(params)
}

// Handlers for filter panel actions to update state synchronously (bypassing v-model microtask delay)
const handleApplyFilters = (updatedFilters: RecipeFilters) => {
  filters.value = updatedFilters
  currentPage.value = 1
  syncStateToUrl()
  isMobileFilterOpen.value = false
}

const handleClearFilters = (clearedFilters: RecipeFilters) => {
  filters.value = clearedFilters
  currentPage.value = 1
  syncStateToUrl()
  isMobileFilterOpen.value = false
}

// Search form submit
const onSearchSubmit = () => {
  currentPage.value = 1 // reset to first page on new search
  syncStateToUrl()
}



// Handle pagination page click
const handlePageChange = (page: number) => {
  currentPage.value = page
  syncStateToUrl()
  // Scroll smoothly to top of recipes grid
  window.scrollTo({ top: 180, behavior: 'smooth' })
}

// Clear all search parameters and filters
const resetAll = () => {
  searchQuery.value = ''
  currentPage.value = 1
  filters.value = {
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
  syncStateToUrl()
}

// Create human-readable pills for active filters
interface FilterPill {
  key: string
  label: string
  icon?: string
  remove: () => void
}

const activeFilterPills = computed(() => {
  const pills: FilterPill[] = []
  const f = filters.value
  
  if (f.category) {
    pills.push({
      key: 'category',
      label: `Категорія: ${categoryTranslations[f.category] || f.category}`,
      remove: () => { f.category = undefined }
    })
  }
  
  if (f.cuisineList && f.cuisineList.length > 0) {
    f.cuisineList.forEach(cuisine => {
      pills.push({
        key: `cuisine-${cuisine}`,
        label: `Кухня: ${cuisineTranslations[cuisine] || cuisine}`,
        remove: () => {
          f.cuisineList = f.cuisineList?.filter(c => c !== cuisine)
        }
      })
    })
  }
  
  if (f.difficulty) {
    pills.push({
      key: 'difficulty',
      label: `Складність: ${difficultyTranslations[f.difficulty] || f.difficulty}`,
      remove: () => { f.difficulty = undefined }
    })
  }
  
  if (f.cookSpeed) {
    pills.push({
      key: 'cookSpeed',
      label: `Швидкість: ${cookSpeedTranslations[f.cookSpeed] || f.cookSpeed}`,
      remove: () => { f.cookSpeed = undefined }
    })
  }
  
  if (f.maxCookTime && f.maxCookTime < 180) {
    pills.push({
      key: 'maxCookTime',
      label: `Час: до ${f.maxCookTime} хв`,
      remove: () => { f.maxCookTime = undefined }
    })
  }
  
  if (f.minHealthScore && f.minHealthScore > 0) {
    pills.push({
      key: 'minHealthScore',
      label: `Здоров'я: ≥ ${f.minHealthScore}%`,
      remove: () => { f.minHealthScore = undefined }
    })
  }
  
  if (f.minRating && f.minRating > 0) {
    pills.push({
      key: 'minRating',
      label: `Рейтинг: ≥ ${f.minRating} ★`,
      remove: () => { f.minRating = undefined }
    })
  }
  
  // Booleans
  const bools: Array<{ key: string; name: string; icon: string }> = [
    { key: 'isVegan', name: 'Веган', icon: 'i-lucide-leaf' },
    { key: 'isVegetarian', name: 'Вегетаріанський', icon: 'i-lucide-egg' },
    { key: 'isGluten_free', name: 'Без глютену', icon: 'i-lucide-wheat-off' },
    { key: 'isDairyFree', name: 'Без лактози', icon: 'i-lucide-milk-off' },
    { key: 'isNutFree', name: 'Без горіхів', icon: 'i-lucide-ban' },
    { key: 'isHalal', name: 'Халяль', icon: 'i-lucide-check-circle' },
    { key: 'isKosher', name: 'Кошерний', icon: 'i-lucide-shield-check' }
  ]
  
  bools.forEach(b => {
    if ((f as any)[b.key]) {
      pills.push({
        key: b.key,
        label: b.name,
        icon: b.icon,
        remove: () => { (f as any)[b.key] = false }
      })
    }
  })
  
  return pills
})

const removeFilterPill = (pill: any) => {
  pill.remove()
  currentPage.value = 1
  syncStateToUrl()
}

// Watch router query parameters to fetch data on changes (handles back/forward button too)
watch(() => route.query, () => {
  parseQueryToState()
  executeSearch()
}, { deep: true })

// Initialize page on mount
onMounted(async () => {
  if (user.value) {
    if (!user.value.dietary || !user.value.allergies) {
      await getRestrictions()
    }
  }
  parseQueryToState()
  await executeSearch()
  isInitialLoad.value = false
})

useSeoMeta({
  title: 'Smak | Пошук рецептів',
  description: 'Шукайте та фільтруйте сотні смачних рецептів на платформі SMAK. Розумний векторний семантичний пошук підбере найкращі страви за вашими вподобаннями.',
  ogTitle: 'SMAK — Розумний каталог рецептів',
  ogDescription: 'Знайдіть кулінарне натхнення завдяки інтелектуальному пошуку рецептів та гнучким дієтичним фільтрам.'
})
</script>

<template>
  <div class="space-y-4 sm:space-y-8 relative">
    
    <!-- Top Welcome Banner & Big Semantic Search Bar -->
    <section class="text-center max-w-3xl lg:max-w-4xl mx-auto space-y-3 sm:space-y-5 py-2 sm:py-4">
      
      <h1 class="font-heading font-black text-3xl sm:text-4xl leading-tight text-smak-neutral-900 dark:text-white">
        Кулінарний путівник
        <span class="bg-linear-to-r from-coral-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent filter drop-shadow-xs">
          вашої мрії
        </span>
      </h1>
      
      <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-2xl mx-auto">
        Шукайте страви природною мовою. Замість простого співпадіння слів наш ШІ аналізує семантичний зміст вашого запиту, щоб знайти ідеальний рецепт.
      </p>


    </section>

    <!-- Main Listing Layout -->
    <div class="space-y-6">
        
        <!-- Results stats block with slide-down expandable filter panel -->
        <div class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100 dark:border-smak-neutral-800/80 rounded-3xl sm:rounded-4xl shadow-xs overflow-hidden transition-all duration-300">
          
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-2.5 sm:p-3 text-left">
            <!-- Results Count / Info (Hidden on mobile) -->
            <div class="hidden sm:flex flex-col pl-3 sm:pl-6 py-1">
              <span class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium">
                Знайдено <strong class="text-smak-neutral-800 dark:text-white font-bold">{{ meta?.totalItems || 0 }}</strong> рецептів
              </span>
              <!-- Sorting Info based on Search Query presence (No icon) -->
              <span class="text-xs text-smak-neutral-400 dark:text-smak-neutral-500 mt-0.5">
                Сортування: {{ searchQuery.trim() ? 'за семантичною близькістю ШІ' : 'спочатку найновіші' }}
              </span>
            </div>

            <!-- Right side: Search + Actions -->
            <div class="flex items-center gap-2 w-full lg:w-auto">
              <!-- Search Input -->
              <div class="flex-1 sm:w-80">
                <AppSearchInput 
                  v-model="searchQuery" 
                  @search="onSearchSubmit" 
                  placeholder="Пошук рецептів..."
                />
              </div>

              <!-- Actions: Filter Dropdown Trigger & Quick Reset -->
              <div class="flex items-center gap-2 shrink-0">
                <!-- Unified Filter Trigger Button -->
                <button
                  type="button"
                  class="h-[42px] rounded-full font-bold flex items-center gap-2 shrink-0 border border-smak-neutral-200 dark:border-smak-neutral-800 bg-transparent hover:bg-transparent hover:border-coral-500 text-smak-neutral-800 dark:text-white hover:text-coral-500 transition-all px-4 sm:px-5 cursor-pointer text-sm"
                  :class="isMobileFilterOpen ? 'border-coral-500! text-coral-500!' : ''"
                  @click="() => { isMobileFilterOpen = !isMobileFilterOpen }"
                >
                  <UIcon name="i-lucide-sliders-horizontal" class="w-4.5 h-4.5 text-coral-500" />
                  <span class="hidden sm:inline">Фільтрувати</span>
                  <span 
                    v-if="activeFilterPills.length > 0" 
                    class="bg-coral-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  >
                    {{ activeFilterPills.length }}
                  </span>
                </button>

                <!-- Reset Button when filters or search exists -->
                <button
                  v-if="activeFilterPills.length > 0 || searchQuery.trim()"
                  type="button"
                  class="h-[42px] rounded-full font-bold shrink-0 px-4 sm:px-5 cursor-pointer text-xs sm:text-sm bg-transparent hover:bg-transparent border border-smak-neutral-200 dark:border-smak-neutral-800 hover:border-coral-500 text-smak-neutral-700 dark:text-smak-neutral-300 hover:text-coral-500 transition-all"
                  @click="resetAll"
                >
                  Скинути все
                </button>
              </div>
            </div>
          </div>

          <!-- Slide-down Horizontal Filter Panel container with smooth transition -->
          <Transition name="slide">
            <div 
              v-show="isMobileFilterOpen" 
              class="border-t border-smak-neutral-100 dark:border-smak-neutral-800/80 bg-smak-neutral-50/15 dark:bg-smak-neutral-950/20 p-6 sm:p-8"
            >
              <RecipeFilterPanel 
                v-model="filters" 
                @apply="handleApplyFilters"
                @clear="handleClearFilters"
              />
            </div>
          </Transition>

        </div>

        <!-- Active Filter Pills Area -->
        <div v-if="activeFilterPills.length > 0" class="flex flex-wrap items-center gap-2 p-1.5 bg-coral-50/20 dark:bg-coral-950/5 border border-coral-100/30 rounded-xl">
          <span class="text-xs font-bold text-smak-neutral-400 uppercase tracking-wider ml-2 shrink-0">
            Активні:
          </span>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="pill in activeFilterPills"
              :key="pill.key"
              color="neutral"
              variant="subtle"
              size="md"
              class="rounded-lg font-semibold text-xs px-2.5 py-1 flex items-center gap-1 bg-white dark:bg-smak-neutral-800 border border-smak-neutral-100 dark:border-smak-neutral-700/50 hover:border-red-400 dark:hover:border-red-900 group"
            >
              <UIcon v-if="pill.icon" :name="pill.icon" class="w-3.5 h-3.5 text-coral-500 shrink-0" />
              <span>{{ pill.label }}</span>
              <button 
                @click="removeFilterPill(pill)" 
                class="p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-smak-neutral-400 group-hover:text-red-500 transition-colors focus:outline-none"
                aria-label="Видалити фільтр"
              >
                <UIcon name="i-lucide-x" class="w-3 h-3" />
              </button>
            </UBadge>
          </div>
        </div>

        <!-- SKELETON LOADING STATE -->
        <RecipeGridSkeleton v-if="loading || isInitialLoad" :count="12" />

        <!-- EMPTY STATE (NO RECIPES IN CATALOG OR NO MATCHES FOR SEARCH) -->
        <div
          v-else-if="recipes.length === 0"
          class="py-12 sm:py-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6"
        >
          <!-- Icon Glow Container -->
          <div class="relative flex items-center justify-center">
            <div class="absolute inset-0 rounded-full bg-coral-400/20 blur-xl"></div>
            <div class="relative w-20 h-20 rounded-3xl bg-linear-to-br from-coral-500/10 to-coral-500/20 dark:from-coral-500/20 dark:to-coral-500/5 ring-1 ring-coral-500/20 flex items-center justify-center text-coral-500 shadow-xs">
              <UIcon :name="activeFilterPills.length > 0 || searchQuery.trim() ? 'i-lucide-utensils-cross' : 'i-lucide-chef-hat'" class="w-10 h-10" />
            </div>
          </div>

          <!-- Text content -->
          <div class="space-y-1.5">
            <h3 class="font-heading font-extrabold text-xl text-smak-neutral-900 dark:text-white">
              {{ activeFilterPills.length > 0 || searchQuery.trim() ? 'Рецептів не знайдено' : 'Рецепти ще очікують на своїх авторів!' }}
            </h3>
            <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-md mx-auto">
              {{ activeFilterPills.length > 0 || searchQuery.trim() ? 'Жодна страва не підійшла під вибрані фільтри або текстовий запит. Спробуйте спростити пошук або очистити фільтри.' : 'Станьте першим та поділіться своєю улюбленою стравою.' }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div v-if="activeFilterPills.length > 0 || searchQuery.trim()" class="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <UButton 
              variant="outline" 
              color="neutral" 
              size="lg"
              class="rounded-full font-bold px-8 py-3.5 justify-center border-smak-neutral-300 dark:border-smak-neutral-700 hover:border-coral-400 transition-all cursor-pointer" 
              @click="resetAll"
            >
              Очистити все
            </UButton>
            <UButton 
              to="/chats" 
              size="lg"
              class="rounded-full font-bold px-8 py-3.5 text-white bg-coral-500 hover:bg-coral-600 border-0 justify-center shadow-md shadow-coral-500/25 hover:shadow-lg hover:shadow-coral-500/35 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
            >
              <UIcon name="i-lucide-sparkles" class="w-5 h-5 animate-pulse" />
              Запитати у ШІ
            </UButton>
          </div>
          <div v-else class="flex justify-center items-center">
            <UButton 
              :to="user ? '/recipes/create' : '/auth/register'" 
              size="lg"
              class="rounded-full font-bold px-8 py-3.5 text-white bg-coral-500 hover:bg-coral-600 border-0 justify-center shadow-md shadow-coral-500/25 hover:shadow-lg hover:shadow-coral-500/35 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
            >
              <UIcon name="i-lucide-plus" class="w-5 h-5" />
              Додати перший рецепт
            </UButton>
          </div>
        </div>

        <!-- RECIPES GRID VIEW -->
        <div v-else class="space-y-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="recipe in recipes" :key="recipe.id" class="h-full">
              <RecipeCard :recipe="recipe" />
            </div>
          </div>

          <!-- PAGINATION FOOTER -->
          <div v-if="meta && meta.totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-smak-neutral-100 dark:border-smak-neutral-800/80 pt-6 mt-4">
            <!-- Items info tracker -->
            <p class="hidden sm:block text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium text-center sm:text-left">
              Показано <span class="font-bold text-smak-neutral-800 dark:text-white">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
              –
              <span class="font-bold text-smak-neutral-800 dark:text-white">{{ Math.min(currentPage * itemsPerPage, meta.totalItems) }}</span>
              із <span class="font-bold text-smak-neutral-800 dark:text-white">{{ meta.totalItems }}</span> рецептів
            </p>

            <!-- Pagination buttons -->
            <AppPagination 
              v-model:page="currentPage"
              :total="meta.totalItems"
              :items-per-page="itemsPerPage"
              :sibling-count="1"
              @update:page="handlePageChange"
              class="sm:w-auto w-full"
            />
          </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  max-height: 540px; /* high enough to cover the horizontal filters panel */
  opacity: 1;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  overflow: hidden;
  border-top-color: transparent !important;
}
</style>
