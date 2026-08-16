<!--
@page-docs
title: Public Chef Profile
description: Public profile page of a culinary chef/author on the SMAK platform. Displays their bio, stats, published recipes, and community reviews.
features:
  - View chef details: display name, username, bio, and awards.
  - View chef stats: total number of recipes, average recipe rating, and total number of reviews received.
  - Browse recipes: paginated grid of all public recipes published by this chef.
  - Browse reviews: community reviews and feedback left by other users on this chef's recipes.
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | Public Chef Profile'
})
import { ref, computed, onMounted } from 'vue'
import { useUser } from '~/composables/useUser'
import type { UserPublicDto } from '~/types/user'
import RecipeCard from '~/components/recipe/card/RecipeCard.vue'
import RecipeGridSkeleton from '~/components/recipe/card/RecipeGridSkeleton.vue'
import AppPagination from '~/components/shared/AppPagination.vue'
import { useRecipes } from '~/composables/useRecipes'

const route = useRoute()
const userId = computed(() => route.params.id as string)

const { getPublicProfile } = useUser()
const { recipes, loading: recipesLoading, meta, fetchRecipes } = useRecipes('user-profile')

const profile = ref<UserPublicDto | null>(null)
const reviews = ref<any[]>([])
const isLoading = ref(true)
const activeTab = ref<'recipes' | 'reviews'>('recipes')

const currentPage = ref(1)
const itemsPerPage = ref(6)

// Reviews state and pagination
const reviewsLoading = ref(false)
const currentReviewsPage = ref(1)
const reviewsPerPage = ref(5)
const reviewsMeta = ref<any>(null)

// Calculate total pages for paginator (handling database query)
const totalPages = computed(() => {
  return meta.value?.totalPages || 0
})

const totalReviewsPages = computed(() => {
  return reviewsMeta.value?.totalPages || 0
})

// Calculate stats from loaded profile
const averageRating = computed(() => {
  return profile.value?.averageRating !== undefined ? profile.value.averageRating : 0
})

const totalReviewsCount = computed(() => {
  return profile.value?.totalReviews !== undefined ? profile.value.totalReviews : 0
})

const totalRecipesCount = computed(() => {
  return meta.value?.totalItems || recipes.value.length || 0
})

const loadUserRecipes = async () => {
  try {
    await fetchRecipes({
      userId: userId.value,
      page: currentPage.value,
      limit: itemsPerPage.value,
      status: 'public' as const
    })
  } catch (err) {
    console.error('Failed to load user recipes', err)
    recipes.value = []
  }
}

const loadUserReviews = async () => {
  reviewsLoading.value = true
  try {
    const { $api } = useNuxtApp()
    const res = await $api<any>(`/users/${userId.value}/reviews`, {
      query: {
        page: currentReviewsPage.value,
        limit: reviewsPerPage.value
      }
    })
    reviews.value = res.data || []
    reviewsMeta.value = res.meta || null
  } catch (err) {
    console.error('Failed to load user reviews', err)
    reviews.value = []
    reviewsMeta.value = null
  } finally {
    reviewsLoading.value = false
  }
}

const handlePageChange = async (newPage: number) => {
  currentPage.value = newPage
  await loadUserRecipes()
  // Scroll to recipes section smoothly on page change
  const element = document.getElementById('author-tabs')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleReviewsPageChange = async (newPage: number) => {
  currentReviewsPage.value = newPage
  await loadUserReviews()
  // Scroll to reviews section smoothly on page change
  const element = document.getElementById('author-tabs')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const fetchPublicData = async () => {
  isLoading.value = true
  try {
    // 1. Fetch public profile
    const profileRes = await getPublicProfile(userId.value)
    if (profileRes) {
      profile.value = profileRes
    } else {
      profile.value = {
        id: userId.value,
        username: 'culinary_enthusiast',
        displayname: 'Пристрасний Кулінар'
      }
    }

    // 2. Fetch recipes of this user
    await loadUserRecipes()

    // 3. Fetch reviews of this user's recipes
    await loadUserReviews()

  } catch (err) {
    console.error('Error fetching public profile data:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPublicData()
})

const displayName = computed(() => profile.value?.displayname || 'Шеф')
const username = computed(() => profile.value?.username || 'chef')
const userInitials = computed(() => displayName.value.substring(0, 2).toUpperCase())

// Formatting date helper
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-8 sm:space-y-10 py-2 sm:py-4">
    <!-- Ambient glowing blobs -->
    <div class="absolute top-24 left-1/4 -translate-x-1/2 w-[350px] h-[350px] bg-linear-to-tr from-coral-500/10 via-orange-500/5 to-transparent rounded-full blur-[80px] pointer-events-none -z-10"></div>
    <div class="absolute top-80 right-1/4 w-[300px] h-[300px] bg-linear-to-tr from-yellow-500/5 via-coral-500/5 to-transparent rounded-full blur-[100px] pointer-events-none -z-10"></div>

    <!-- Loading Skeleton Screen -->
    <div v-if="isLoading" class="space-y-8">
      <div class="py-8 flex items-center gap-6 animate-pulse border-b border-smak-neutral-200/60 dark:border-smak-neutral-800">
        <div class="w-24 h-24 rounded-full bg-smak-neutral-200 dark:bg-smak-neutral-800"></div>
        <div class="space-y-3 flex-1">
          <div class="h-7 bg-smak-neutral-200 dark:bg-smak-neutral-800 w-1/4 rounded-xl"></div>
          <div class="h-4 bg-smak-neutral-200 dark:bg-smak-neutral-800 w-1/3 rounded-lg"></div>
        </div>
      </div>
    </div>

    <!-- Public Profile Main Wrapper -->
    <div v-else class="space-y-8">
      
      <!-- Public User Profile Header (Clean & Borderless Container) -->
      <div class="relative py-4 pb-4 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        
        <!-- Avatar section -->
        <div class="relative shrink-0">
          <UAvatar 
            :alt="displayName" 
            :label="userInitials"
            size="xl"
            class="ring-4 ring-coral-400/80 bg-coral-100 text-coral-700 dark:bg-coral-950/20 dark:text-coral-300 font-extrabold w-24 h-24 sm:w-28 sm:h-28 text-2xl sm:text-3xl shadow-md"
          />
          <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-gradient text-white border-2 border-white dark:border-smak-neutral-950 rounded-full flex items-center justify-center shadow-md">
            <UIcon name="i-lucide-award" class="w-4.5 h-4.5" />
          </div>
        </div>

        <!-- Meta Details & Stats Summary -->
        <div class="flex-1 text-center sm:text-left space-y-4">
          <div class="space-y-1">
            <h1 class="text-3xl sm:text-4xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              {{ displayName }}
            </h1>
            <p class="text-sm sm:text-base font-bold text-coral-500 dark:text-coral-400">
              @{{ username }}
            </p>
          </div>

          <!-- Dynamic Counters / Stats Dashboard -->
          <div class="flex items-center justify-center sm:justify-start gap-6 sm:gap-10 pt-2">
            <!-- Stat 1: Recipes -->
            <div class="flex flex-col items-center sm:items-start">
              <span class="text-xl sm:text-2xl font-black font-heading text-smak-neutral-900 dark:text-white">
                {{ totalRecipesCount }}
              </span>
              <span class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-semibold">
                Рецептів
              </span>
            </div>

            <!-- Divider -->
            <div class="w-px h-8 bg-smak-neutral-200 dark:bg-smak-neutral-800"></div>

            <!-- Stat 2: Rating -->
            <div class="flex flex-col items-center sm:items-start">
              <span class="text-xl sm:text-2xl font-black font-heading text-amber-500 flex items-center gap-1.5">
                <UIcon name="i-lucide-star" class="w-5 h-5 fill-current" />
                {{ averageRating }}
              </span>
              <span class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-semibold">
                Рейтинг
              </span>
            </div>

            <!-- Divider -->
            <div class="w-px h-8 bg-smak-neutral-200 dark:bg-smak-neutral-800"></div>

            <!-- Stat 3: Reviews -->
            <div class="flex flex-col items-center sm:items-start">
              <span class="text-xl sm:text-2xl font-black font-heading text-coral-500 flex items-center gap-1.5">
                <UIcon name="i-lucide-message-circle" class="w-5 h-5" />
                {{ totalReviewsCount }}
              </span>
              <span class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-semibold">
                Відгуків
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Navigation Tabs (Clean Borderless Pill Switcher) -->
      <div id="author-tabs" class="space-y-6">
        <!-- Clean Pill Tabs Bar with Symmetric Top and Bottom Dividers -->
        <div class="flex items-center gap-2 py-4 border-y border-smak-neutral-200/60 dark:border-smak-neutral-800 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            class="rounded-full px-5 py-2.5 text-sm sm:text-base font-bold cursor-pointer transition-all duration-200 flex items-center gap-2 shrink-0"
            :class="[
              activeTab === 'recipes'
                ? 'bg-coral-500 text-white shadow-md shadow-coral-500/25'
                : 'text-smak-neutral-600 dark:text-smak-neutral-400 hover:text-coral-500 dark:hover:text-coral-400 hover:bg-coral-50/50 dark:hover:bg-coral-950/20'
            ]"
            @click="activeTab = 'recipes'"
          >
            <UIcon name="i-lucide-book-open" class="w-4.5 h-4.5 text-current shrink-0" />
            <span>Рецепти автора ({{ totalRecipesCount }})</span>
          </button>
          <button
            type="button"
            class="rounded-full px-5 py-2.5 text-sm sm:text-base font-bold cursor-pointer transition-all duration-200 flex items-center gap-2 shrink-0"
            :class="[
              activeTab === 'reviews'
                ? 'bg-coral-500 text-white shadow-md shadow-coral-500/25'
                : 'text-smak-neutral-600 dark:text-smak-neutral-400 hover:text-coral-500 dark:hover:text-coral-400 hover:bg-coral-50/50 dark:hover:bg-coral-950/20'
            ]"
            @click="activeTab = 'reviews'"
          >
            <UIcon name="i-lucide-message-square" class="w-4.5 h-4.5 text-current shrink-0" />
            <span>Відгуки спільноти ({{ totalReviewsCount }})</span>
          </button>
        </div>

        <!-- Tab Content Display -->
        <div>
          <!-- Recipes Tab -->
          <div v-if="activeTab === 'recipes'" class="space-y-8">
            <!-- SKELETON LOADING STATE -->
            <div v-if="recipesLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RecipeGridSkeleton :count="4" />
            </div>

            <!-- EMPTY STATE -->
            <div v-else-if="recipes.length === 0" class="text-center py-16 px-4">
              <div class="w-16 h-16 rounded-full bg-coral-50 dark:bg-coral-950/20 flex items-center justify-center text-coral-500 mx-auto mb-4">
                <UIcon name="i-lucide-book-open" class="w-8 h-8" />
              </div>
              <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white mb-1.5">
                Поки немає рецептів
              </h3>
              <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-sm mx-auto">
                У цього автора поки немає опублікованих рецептів.
              </p>
            </div>

            <!-- REAL GRID -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RecipeCard 
                v-for="recipe in recipes" 
                :key="recipe.id"
                :recipe="recipe"
              />
            </div>

            <!-- PAGINATION -->
            <div v-if="totalPages > 1 && !recipesLoading" class="flex justify-center pt-4">
              <AppPagination 
                v-model:page="currentPage" 
                :total="totalRecipesCount"
                :items-per-page="itemsPerPage"
                @update:page="handlePageChange"
              />
            </div>
          </div>

          <!-- Reviews Tab -->
          <div v-if="activeTab === 'reviews'" class="space-y-4">
            <!-- SKELETON LOADING STATE -->
            <div v-if="reviewsLoading" class="space-y-4 animate-pulse">
              <div v-for="i in 2" :key="i" class="p-6 rounded-2xl bg-smak-neutral-50 dark:bg-smak-neutral-900 h-36 border border-smak-neutral-200/60 dark:border-smak-neutral-800"></div>
            </div>

            <template v-else>
              <!-- REAL REVIEWS -->
              <div 
                v-for="review in reviews" 
                :key="review.id"
                class="p-5 sm:p-6 rounded-2xl bg-smak-neutral-50/60 dark:bg-smak-neutral-900/40 border border-smak-neutral-200/60 dark:border-smak-neutral-800/60 space-y-4 text-left"
              >
                <!-- Reviewer header -->
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-3">
                    <NuxtLink :to="`/users/${review.user?.id}`" class="shrink-0 flex">
                      <UAvatar 
                        :alt="review.user?.displayname" 
                        :label="review.user?.displayname?.substring(0, 2).toUpperCase()"
                        size="md" 
                        class="bg-coral-100 text-coral-700 dark:bg-coral-950/20 dark:text-coral-300 font-bold hover:ring-2 hover:ring-coral-400 transition-all"
                      />
                    </NuxtLink>
                    <div class="flex flex-col text-left">
                      <NuxtLink 
                        :to="`/users/${review.user?.id}`" 
                        class="font-heading font-bold text-sm sm:text-base text-smak-neutral-900 dark:text-white hover:text-coral-500 transition-colors"
                      >
                        {{ review.user?.displayname || review.user?.username }}
                      </NuxtLink>
                      <span class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400">
                        {{ formatDate(review.createdAt) }}
                      </span>
                    </div>
                  </div>

                  <!-- Rating Stars -->
                  <div class="flex items-center gap-0.5 text-base select-none">
                    <span 
                      v-for="i in 5" 
                      :key="i"
                      class="transition-colors duration-300 font-sans"
                      :class="[i <= review.rating ? 'text-amber-400' : 'text-smak-neutral-200 dark:text-smak-neutral-800']"
                    >
                      ★
                    </span>
                  </div>
                </div>

                <!-- Review Content -->
                <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                  {{ review.text }}
                </p>

                <!-- Attached Photo -->
                <div v-if="review.imageId" class="mt-4">
                  <div class="max-w-md w-full rounded-2xl overflow-hidden border border-smak-neutral-200/60 dark:border-smak-neutral-800 bg-smak-neutral-50 dark:bg-smak-neutral-950">
                    <SharedCloudImage 
                      :public-id="review.imageId" 
                      :alt="'Фото страви від ' + (review.user?.displayname || review.user?.username)"
                      :width="600"
                      aspect="video"
                      class="hover:scale-102 transition-transform duration-500 cursor-pointer"
                    />
                  </div>
                </div>

                <!-- Connection to the corresponding recipe -->
                <div class="pt-3 border-t border-smak-neutral-200/50 dark:border-smak-neutral-800/80 flex items-center justify-end gap-1.5 text-xs sm:text-sm">
                  <span class="text-smak-neutral-500 dark:text-smak-neutral-400 font-medium">Рецепт:</span>
                  <NuxtLink 
                    :to="`/recipes/${review.recipe?.id}`" 
                    class="font-bold text-coral-500 hover:text-coral-600 truncate max-w-[180px] sm:max-w-xs transition-colors"
                  >
                    {{ review.recipe?.title }}
                  </NuxtLink>
                </div>
              </div>

              <!-- Empty state fallback if no reviews -->
              <div v-if="reviews.length === 0" class="text-center py-16 px-4">
                <div class="w-16 h-16 rounded-full bg-coral-50 dark:bg-coral-950/20 flex items-center justify-center text-coral-500 mx-auto mb-4">
                  <UIcon name="i-lucide-message-square" class="w-8 h-8" />
                </div>
                <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white mb-1.5">
                  Поки немає відгуків
                </h3>
                <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-sm mx-auto">
                  Будьте першим, хто прокоментує страви автора!
                </p>
              </div>

              <!-- PAGINATION -->
              <div v-if="totalReviewsPages > 1" class="flex justify-center pt-4">
                <AppPagination 
                  v-model:page="currentReviewsPage" 
                  :total="totalReviewsCount"
                  :items-per-page="reviewsPerPage"
                  @update:page="handleReviewsPageChange"
                />
              </div>
            </template>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.transition-smooth {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
