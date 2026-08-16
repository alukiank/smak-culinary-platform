<!--
@page-docs
title: Detailed recipe view
description: Page for viewing a specific dish on the SMAK platform. Displays detailed information about the dish, its ingredients, cooking steps, health indicators, YouTube video, comments/reviews, and suggests similar recipes selected by AI.
features:
  - Recipe Hero card: photos, title, description, rating, author, button to start step-by-step cooking (Cook Mode: /recipes/cook/:id).
  - Recipe Passport: total cooking time, difficulty level, number of servings, health score, calories, BJU (proteins, fats, carbohydrates), and dietary badges.
  - List of ingredients and step-by-step instructions.
  - YouTube Video recipe: built-in video player (if added by author).
  - Review and rating section: ability to add reviews, rate the dish from 1 to 5 stars and comment.
  - AI recommendations block: selection of similar recipes based on semantic analysis of ingredients and dish category.
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipes } from '~/composables/useRecipes'
import RecipeHero from '~/components/recipe/detail/RecipeHero.vue'
import RecipePassport from '~/components/recipe/detail/RecipePassport.vue'
import RecipeIngredients from '~/components/recipe/detail/RecipeIngredients.vue'
import RecipeDirections from '~/components/recipe/detail/RecipeDirections.vue'
import RecipeVideo from '~/components/recipe/detail/RecipeVideo.vue'
import RecipeAiChatFab from '~/components/recipe/detail/RecipeAiChatFab.vue'
import RecipeCard from '~/components/recipe/card/RecipeCard.vue'
import RecipeHeroSkeleton from '~/components/recipe/detail/RecipeHeroSkeleton.vue'
import RecipePassportSkeleton from '~/components/recipe/detail/RecipePassportSkeleton.vue'
import RecipeIngredientsSkeleton from '~/components/recipe/detail/RecipeIngredientsSkeleton.vue'
import RecipeDirectionsSkeleton from '~/components/recipe/detail/RecipeDirectionsSkeleton.vue'
import RecipeReviewsSkeleton from '~/components/recipe/reviews/RecipeReviewsSkeleton.vue'
import RecipeGridSkeleton from '~/components/recipe/card/RecipeGridSkeleton.vue'

const route = useRoute()

const { user } = useAuth()
const { 
  fetchRecipeById, 
  fetchSimilarRecipes, 
  similarRecipes, 
  similarLoading,
  similarError 
} = useRecipes()

const recipeId = ref(route.params.id as string)

const hasIngredientSelection = ref(false)
const missingIngredients = ref<string[]>([])

const handleIngredientSelection = (payload: { hasSelection: boolean; missingIngredients: string[] }) => {
  hasIngredientSelection.value = payload.hasSelection
  missingIngredients.value = payload.missingIngredients
}

const { data: recipe, pending: recipeLoading, error: recipeError, refresh } = await useAsyncData(
  `recipe-${recipeId.value}`, 
  () => fetchRecipeById(recipeId.value)
)

// Cook Mode: smooth scroll to ingredients & directions on page
const startCooking = () => {
  const el = document.getElementById('recipe-cooking')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  } else if (recipe.value) {
    navigateTo(`/recipes/cook/${recipe.value.id}`)
  }
}

// React to router ID changes
watch(() => route.params.id, async (newId) => {
  if (newId) {
    recipeId.value = newId as string
    await refresh()
    await fetchSimilarRecipes(recipeId.value)
  }
})

// Initialize similar recipes and retry if SSR failed
onMounted(async () => {
  // If SSR failed (likely 403 for private recipe), retry on client
  if (recipeError.value && user.value) {
    await refresh()
  }
  
  if (recipe.value) {
    await fetchSimilarRecipes(recipeId.value)
  }
})

// SEO metadata integration
useSeoMeta({
  title: computed(() => recipe.value ? `Smak | ${recipe.value.title}` : 'Smak | Завантаження рецепту...'),
  description: computed(() => recipe.value ? recipe.value.description : 'Перегляд детальної інформації про рецепт, інгредієнти, кроки приготування та відгуки користувачів.'),
  ogTitle: computed(() => recipe.value ? recipe.value.title : 'Рецепт | SMAK'),
  ogDescription: computed(() => recipe.value ? recipe.value.description : 'Перегляд рецепту на платформі SMAK.')
})
</script>

<template>
  <div class="space-y-6 sm:space-y-8 text-left">

    <!-- ERROR STATE -->
    <div v-if="recipeError" class="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100/20 dark:border-rose-900/10 rounded-3xl p-10 text-center max-w-xl mx-auto space-y-4">
      <div class="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
        <UIcon name="i-lucide-alert-circle" class="w-8 h-8 animate-bounce" />
      </div>
      <h2 class="font-heading font-bold text-2xl text-rose-700 dark:text-rose-400">
        {{ recipeError.statusCode === 403 ? 'Доступ обмежено' : 'Рецепт не знайдено' }}
      </h2>
      <p class="text-smak-neutral-500 dark:text-smak-neutral-400 text-sm leading-relaxed max-w-md mx-auto font-medium">
        {{ recipeError.statusCode === 403 
            ? 'Цей рецепт приватний або знаходиться на модерації. Тільки автор може його переглядати.' 
            : 'Вибачте, сталася помилка при завантаженні цієї страви. Можливо, рецепт було переміщено або видалено.' 
        }}
      </p>
      <div class="flex items-center justify-center gap-3">
        <UButton to="/recipes" color="neutral" variant="ghost" class="rounded-xl font-bold px-5">
          На головну
        </UButton>
        <UButton color="primary" class="rounded-xl font-bold px-5" @click="() => refresh()" :loading="recipeLoading">
          Спробувати знову
        </UButton>
      </div>
    </div>

    <!-- LOADING STATE -->
    <div v-else-if="recipeLoading" class="space-y-6 sm:space-y-10">
      <RecipeHeroSkeleton />
      <RecipePassportSkeleton />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-6">
          <RecipeIngredientsSkeleton />
        </div>
        <div class="lg:col-span-6">
          <RecipeDirectionsSkeleton />
        </div>
      </div>
      <RecipeReviewsSkeleton />
    </div>

    <!-- MAIN LOADED STATE -->
    <div v-else-if="recipe" class="space-y-6 sm:space-y-10">
      
      <!-- ROW 1: Visual Showcase and Metadata -->
      <section>
        <RecipeHero :recipe="recipe" @start-cooking="startCooking" />
      </section>

      <!-- ROW 2: Culinary Passport (Full Width Horizontal Showcase) -->
      <section>
        <RecipePassport :recipe="recipe" />
      </section>

      <!-- ROW 3: Ingredients & Directions Section -->
      <section id="recipe-cooking" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24">
        <div class="lg:col-span-5 h-full">
          <RecipeIngredients 
            v-if="recipe.ingredients && recipe.ingredients.length > 0" 
            :ingredients="recipe.ingredients" 
            @selection-change="handleIngredientSelection"
          />
        </div>
        <div class="lg:col-span-7 h-full">
          <RecipeDirections v-if="recipe.directions && recipe.directions.length > 0" :directions="recipe.directions" />
        </div>
      </section>

      <!-- ROW 3: YouTube Video (Full Width) -->
      <section v-if="recipe.youtubeVideoUrl">
        <RecipeVideo :youtube-video-url="recipe.youtubeVideoUrl" />
      </section>

      <!-- RECIPE REVIEWS SECTION -->
      <section>
        <RecipeReviews 
          v-if="recipe"
          :recipe-id="recipe.id" 
          :recipe-rating="recipe.rating"
          :recipe-num-ratings="recipe.numRatings"
          @review-added="refresh"
        />
      </section>

    </div>

    <!-- SIMILAR RECIPES SECTION -->
    <section class="hidden sm:block border-t border-smak-neutral-100 dark:border-smak-neutral-800/80 pt-6 sm:pt-10 space-y-6 sm:space-y-8 text-left">
      <h2 class="font-heading font-bold text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-2.5">
        <span>Схожі рецепти від ШІ-помічника</span>
      </h2>

      <RecipeGridSkeleton v-if="similarLoading" :count="3" />

      <div v-else-if="similarError" class="text-sm text-smak-neutral-400 italic font-semibold">
        Помилка завантаження схожих кулінарних пропозицій.
      </div>

      <div v-else-if="similarRecipes.length === 0" class="text-sm text-smak-neutral-400 italic font-semibold">
        Не вдалося знайти схожі рецепти. Ця страва є унікальною!
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <div v-for="sim in similarRecipes" :key="sim.id">
          <RecipeCard :recipe="sim" />
        </div>
      </div>
    </section>

    <!-- Floating AI Chat FAB Assistant -->
    <RecipeAiChatFab 
      v-if="recipe" 
      :recipe="recipe" 
      :has-selection="hasIngredientSelection"
      :missing-ingredients="missingIngredients"
    />

  </div>
</template>
