<script setup lang="ts">
import RecipeAddToCollectionModal from '~/components/recipe/modals/RecipeAddToCollectionModal.vue'
import type { RecipeResponseDto } from '~/types/recipe'
import { useUser } from '~/composables/useUser'
import { 
  translateCategory, 
  translateDifficulty, 
  translateTaste,
  getActiveDiets,
} from '~/utils/formatters'
import { useCollections } from '~/composables/useCollections'

const props = withDefaults(defineProps<{
  recipe: RecipeResponseDto
  isAdmin?: boolean
}>(), {
  isAdmin: false
})

// Calculate total time
const totalTime = computed(() => {
  return (props.recipe.prepTime || 0) + (props.recipe.cookTime || 0)
})

// Author display name and avatar initials
const authorName = computed(() => props.recipe.user?.displayname || props.recipe.user?.username || 'Гість')
const authorInitials = computed(() => authorName.value.substring(0, 2).toUpperCase())

// Generate up to 2 dynamic tags to match landing style overlays
const topTags = computed(() => {
  const tags: string[] = []
  
  const activeDiets = getActiveDiets(props.recipe)
  
  // Filter active diets to avoid showing both Vegetarian and Vegan at the same time,
  // and keep only the ones originally supported as RecipeCard tags (Vegan, Vegetarian, Gluten Free, Dairy Free)
  const filteredDiets = activeDiets.filter(diet => {
    if (diet.key === 'isVegetarian' && activeDiets.some(d => d.key === 'isVegan')) {
      return false
    }
    return ['isVegan', 'isVegetarian', 'isGluten_free', 'isDairyFree'].includes(diet.key)
  })
  
  filteredDiets.forEach(diet => {
    tags.push(diet.label)
  })
  
  if (tags.length < 2 && props.recipe.tastes) {
    props.recipe.tastes.forEach(taste => {
      if (tags.length < 2) {
        tags.push(translateTaste(taste))
      }
    })
  }
  
  if (tags.length === 0) {
    tags.push('Домашнє')
  }
  
  return tags.slice(0, 2)
})

const healthScoreColor = computed(() => {
  const score = props.recipe.healthScore || 0
  if (score >= 70) return 'text-emerald-500 dark:text-emerald-400'
  if (score >= 50) return 'text-amber-500 dark:text-amber-400 font-bold'
  return 'text-rose-500 dark:text-rose-400'
})
const { user } = useUser()

const isCollectionModalOpen = ref(false)
const overlay = useOverlay()
const { isRecipeInAnyCollection, removeRecipeFromAllCollections, initCollections } = useCollections()

// Watch for user availability to initialize collections map (especially after refresh)
watch(user, (newUser) => {
  if (newUser) initCollections()
}, { immediate: true })

onMounted(() => {
  if (user.value) initCollections()
})

const isInCollection = computed(() => isRecipeInAnyCollection(props.recipe.id))

const handleCollectionClick = async () => {
  if (isInCollection.value) {
    // Quick remove from all collections as requested
    await removeRecipeFromAllCollections(props.recipe.id)
  } else {
    // Open modal to choose collection
    overlay.create(RecipeAddToCollectionModal, {
      props: {
        recipeId: props.recipe.id,
        recipeTitle: props.recipe.title
      }
    }).open()
  }
}
</script>

<template>
  <div class="group bg-white dark:bg-smak-neutral-900 rounded-[1.5rem] overflow-hidden border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-xs hover:shadow-coral-500/5 hover:border-coral-200 dark:hover:border-coral-900/30 hover:-translate-y-1 transition-all duration-300 flex flex-col text-left h-full">
    
    <!-- Image Section -->
    <div class="relative h-56 w-full overflow-hidden shrink-0">
      <SharedCloudImage 
        :public-id="recipe.coverImageId" 
        :alt="recipe.title"
        :width="800"
        aspect="auto"
        class="w-full h-full transition-transform duration-500 group-hover:scale-105"
      />
      
      <!-- Top Left Overlay Tags -->
      <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
        <span 
          v-for="(tag, tIdx) in topTags" 
          :key="tIdx"
          class="px-2.5 py-1 bg-white/95 dark:bg-smak-neutral-900/95 text-smak-neutral-800 dark:text-white rounded-lg text-[10px] font-bold shadow-xs uppercase tracking-wider border border-white/10"
        >
          {{ tag }}
        </span>
      </div>
      
      <!-- Bottom Left Category Overlay -->
      <span class="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white rounded-md text-[11px] font-semibold">
        {{ translateCategory(recipe.category) }}
      </span>
    </div>

    <!-- Info Section -->
    <div class="p-6 flex-1 flex flex-col gap-4">
      
      <!-- Metadata Row: Time, Difficulty and Health Score -->
      <div class="flex items-center justify-between text-xs text-smak-neutral-400 dark:text-smak-neutral-500 font-semibold shrink-0 gap-1">
        <span class="flex items-center gap-1" title="Час приготування">
          <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-smak-neutral-400" />
          {{ totalTime > 0 ? `${totalTime} хв` : '—' }}
        </span>
        <span class="flex items-center gap-1.5" title="Складність">
          <span 
            class="w-2 h-2 rounded-full" 
            :class="[
              recipe.difficulty === 'easy' ? 'bg-green-500' : 
              recipe.difficulty === 'medium' ? 'bg-orange-500' : 'bg-red-500'
            ]"
          ></span>
          {{ translateDifficulty(recipe.difficulty) }}
        </span>
        <span class="flex items-center gap-1 font-extrabold text-[13px]" :class="healthScoreColor" title="Індекс здоров'я (корисність)">
          <UIcon name="i-lucide-apple" class="w-4 h-4 shrink-0" />
          <span>{{ recipe.healthScore }}%</span>
        </span>
      </div>

      <!-- Title -->
      <h3 class="font-heading font-bold text-base sm:text-lg text-smak-neutral-900 dark:text-white line-clamp-2 leading-snug group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors duration-300">
        <NuxtLink :to="isAdmin ? `/admin/recipes/${recipe.id}` : `/recipes/${recipe.id}`">
          {{ recipe.title }}
        </NuxtLink>
      </h3>

      <!-- Author and Reviews Footer of Card -->
      <div class="flex items-center justify-between pt-4 border-t border-smak-neutral-100 dark:border-smak-neutral-800/80 mt-auto shrink-0 gap-2">
        <NuxtLink 
          v-if="recipe.user?.id"
          :to="`/users/${recipe.user.id}`"
          class="flex items-center gap-2 overflow-hidden max-w-[55%] hover:text-coral-500 dark:hover:text-coral-400 transition-colors cursor-pointer group/author"
        >
          <UAvatar 
            :alt="authorName" 
            :label="authorInitials"
            size="xs"
            class="bg-coral-50 text-coral-600 dark:bg-coral-950/20 dark:text-coral-400 font-bold shrink-0 ring-1 ring-coral-400/20 group-hover/author:ring-coral-400 transition-all"
          />
          <span class="text-xs font-semibold text-smak-neutral-600 dark:text-smak-neutral-300 truncate group-hover/author:underline">
            {{ authorName }}
          </span>
        </NuxtLink>
        <div v-else class="flex items-center gap-2 overflow-hidden max-w-[55%]">
          <UAvatar 
            :alt="authorName" 
            :label="authorInitials"
            size="xs"
            class="bg-coral-50 text-coral-600 dark:bg-coral-950/20 dark:text-coral-400 font-bold shrink-0 ring-1 ring-coral-400/20"
          />
          <span class="text-xs font-semibold text-smak-neutral-600 dark:text-smak-neutral-300 truncate">
            {{ authorName }}
          </span>
        </div>
        
        <!-- Rating & Reviews Side-by-Side -->
        <div class="flex items-center gap-1 text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 shrink-0">
          <span class="text-[11px] font-semibold text-smak-neutral-400 dark:text-smak-neutral-500">
            {{ recipe.numRatings || 0 }} відгуків
          </span>
          <span class="text-smak-neutral-300 dark:text-smak-neutral-700 font-normal mx-0.5">•</span>
          <span class="flex items-center gap-0.5 text-yellow-500 font-extrabold">
            <UIcon name="i-lucide-star" class="w-3.5 h-3.5 fill-current" />
            <span>{{ recipe.rating > 0 ? recipe.rating.toFixed(1) : '0' }}</span>
          </span>
        </div>
      </div>

    </div>
  </div>
</template>
