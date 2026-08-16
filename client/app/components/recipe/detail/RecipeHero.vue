<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  translateCategory, 
  translateDifficulty, 
} from '~/utils/formatters'
import { useAuth } from '~/composables/useAuth'
import { useCollections } from '~/composables/useCollections'
import RecipeAddToCollectionModal from '~/components/recipe/modals/RecipeAddToCollectionModal.vue'

const props = defineProps<{
  recipe: any
}>()

const emit = defineEmits<{
  (e: 'start-cooking'): void
}>()

const activeGalleryIndex = ref(0)
const { user } = useAuth()
const overlay = useOverlay()
const { isRecipeInAnyCollection, removeRecipeFromAllCollections, initCollections } = useCollections()

let sliderTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (user.value) initCollections()

  // Auto rotate photo every 6 seconds if there are multiple images
  if (galleryImages.value.length > 1) {
    sliderTimer = setInterval(() => {
      activeGalleryIndex.value = (activeGalleryIndex.value + 1) % galleryImages.value.length
    }, 6000)
  }
})

onUnmounted(() => {
  if (sliderTimer) clearInterval(sliderTimer)
})

const isInCollection = computed(() => isRecipeInAnyCollection(props.recipe.id))

const handleCollectionClick = async () => {
  if (isInCollection.value) {
    await removeRecipeFromAllCollections(props.recipe.id)
  } else {
    overlay.create(RecipeAddToCollectionModal, {
      props: {
        recipeId: props.recipe.id,
        recipeTitle: props.recipe.title
      }
    }).open()
  }
}

const isOwner = computed(() => {
  if (!user.value || !props.recipe?.user) return false
  const currentUserId = user.value.id
  const authorId = props.recipe.user.id
  return currentUserId === authorId || user.value.role === 'admin'
})

const galleryImages = computed(() => {
  const images: string[] = []
  if (props.recipe?.coverImageId) {
    images.push(props.recipe.coverImageId)
  }
  if (props.recipe?.galleryImageIds && props.recipe.galleryImageIds.length > 0) {
    images.push(...props.recipe.galleryImageIds)
  }
  return images
})

const totalTime = computed(() => {
  if (!props.recipe) return 0
  return (props.recipe.prepTime || 0) + (props.recipe.cookTime || 0)
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
    <!-- Media Column (Left) - Styled like the Auth / Login slider -->
    <div class="lg:col-span-7 flex flex-col h-full space-y-4">
      <!-- Big image view card with crossfade slider & login page aesthetics -->
      <div class="relative flex-1 aspect-4/3 sm:aspect-16/10 rounded-3xl sm:rounded-4xl overflow-hidden border border-smak-neutral-100/80 dark:border-white/5 shadow-md group bg-smak-neutral-950">
        
        <!-- Crossfade images -->
        <TransitionGroup name="fade">
          <SharedCloudImage 
            v-for="(imgId, idx) in galleryImages"
            :key="imgId"
            v-show="idx === activeGalleryIndex"
            :public-id="imgId" 
            :alt="recipe.title"
            :width="1200"
            aspect="auto"
            class="absolute inset-0 w-full h-full transition-transform duration-1000 ease-out group-hover:scale-105 object-cover"
          />
        </TransitionGroup>

        <!-- Dark Gradient Overlay for legibility (matching auth slider) -->
        <div class="absolute inset-0 bg-linear-to-t from-smak-neutral-950/80 via-smak-neutral-950/25 to-black/20 pointer-events-none"></div>

        <!-- Top Bar: Category Badge & Slider Pagination Dots -->
        <div class="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3">
          <!-- Category Badge -->
          <span class="px-3.5 py-1.5 bg-black/40 backdrop-blur-md text-white border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest shadow-xs select-none">
            {{ translateCategory(recipe.category) }}
          </span>

          <!-- Dots Pagination (matching auth page slider) -->
          <div v-if="galleryImages.length > 1" class="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 select-none">
            <button
              v-for="(_, i) in galleryImages"
              :key="i"
              @click="activeGalleryIndex = i"
              type="button"
              class="h-1.5 rounded-full transition-all duration-300 cursor-pointer border-0 p-0"
              :class="i === activeGalleryIndex ? 'w-6 bg-coral-500' : 'w-1.5 bg-white/40 hover:bg-white/70'"
              :aria-label="`Слайд ${i + 1}`"
            ></button>
          </div>
        </div>
        
        <!-- Bottom Row: Diet Badges -->
        <div class="absolute bottom-4 left-4 flex flex-wrap gap-1.5 z-20 select-none">
          <span 
            v-if="recipe.isVegan" 
            class="px-3.5 py-1.5 bg-emerald-500/90 backdrop-blur-xs text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            🌱 Веган
          </span>
          <span 
            v-else-if="recipe.isVegetarian" 
            class="px-3.5 py-1.5 bg-green-500/90 backdrop-blur-xs text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            🥗 Вегетаріанське
          </span>
          <span 
            v-if="recipe.isGluten_free" 
            class="px-3.5 py-1.5 bg-amber-500/90 backdrop-blur-xs text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            🌾 Без глютену
          </span>
        </div>

        <!-- Mobile Action Button (Add to collection) -->
        <div class="sm:hidden absolute top-4 right-4 flex gap-2 z-20">
          <button
            v-if="user"
            class="w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 focus:outline-none cursor-pointer group/bm"
            :class="[
              isInCollection 
                ? 'bg-coral-500 text-white border-coral-500 shadow-lg shadow-coral-500/40' 
                : 'bg-coral-50/90 dark:bg-coral-950/50 text-coral-500 border-coral-300 dark:border-coral-500/40 backdrop-blur-md hover:bg-coral-100 dark:hover:bg-coral-900/40'
            ]"
            @click="handleCollectionClick"
            :title="isInCollection ? 'Вилучити з колекцій' : 'Додати в колекцію'"
          >
            <UIcon 
              :name="isInCollection ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'" 
              class="w-5.5 h-5.5 transition-all duration-300" 
              :class="[
                isInCollection 
                  ? 'fill-white text-white' 
                  : 'text-coral-500 group-hover/bm:fill-coral-500'
              ]"
            />
          </button>
        </div>
      </div>

      <!-- Thumbnail Gallery Switcher -->
      <div v-if="galleryImages.length > 1" class="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none shrink-0 z-30 relative select-none">
        <button 
          v-for="(imgId, idx) in galleryImages" 
          :key="idx"
          @click="activeGalleryIndex = idx"
          class="relative w-20 h-14 sm:w-22 sm:h-16 rounded-2xl overflow-hidden shrink-0 border-2 transition-all duration-300 focus:outline-none cursor-pointer"
          :class="[activeGalleryIndex === idx ? 'border-coral-500 scale-102 ring-4 ring-coral-500/10' : 'border-smak-neutral-200/60 dark:border-white/5 opacity-60 hover:opacity-100']"
        >
          <SharedCloudImage 
            :public-id="imgId" 
            :width="200"
            aspect="auto"
            alt="Слайд"
            class="w-full h-full object-cover"
          />
        </button>
      </div>
    </div>
    
    <!-- Showcase Content & Minimalist Metrics Column (Right) -->
    <div class="relative lg:col-span-5 flex flex-col justify-between space-y-6">
      
      <div class="space-y-4">
        <!-- Title & Bookmark Button Row (Aligned to top-right) -->
        <div class="flex items-start justify-between gap-4 pr-2 sm:pr-0">
          <h1 class="font-heading font-bold text-2xl sm:text-3xl text-smak-neutral-900 dark:text-white leading-tight">
            {{ recipe.title }}
          </h1>

          <!-- Collection Bookmark Button -->
          <div class="hidden sm:flex items-center gap-2 shrink-0 pt-0.5">
            <button
              v-if="user"
              class="w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 focus:outline-none cursor-pointer group/bm"
              :class="[
                isInCollection 
                  ? 'bg-coral-500 text-white border-coral-500 shadow-lg shadow-coral-500/20 scale-105' 
                  : 'bg-coral-50/80 dark:bg-coral-950/30 text-coral-500 border-coral-300 dark:border-coral-500/40 hover:bg-coral-100 dark:hover:bg-coral-900/40'
              ]"
              @click="handleCollectionClick"
              :title="isInCollection ? 'Вилучити з усіх колекцій' : 'Додати до колекції'"
            >
              <UIcon 
                :name="isInCollection ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'" 
                class="w-5.5 h-5.5 transition-all duration-300" 
                :class="[
                  isInCollection 
                    ? 'fill-white text-white' 
                    : 'text-coral-500 group-hover/bm:fill-coral-500'
                ]"
              />
            </button>
          </div>
        </div>

        <!-- Description -->
        <p class="text-base sm:text-lg text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed font-medium">
          {{ recipe.description }}
        </p>
      </div>

      <!-- Refined Minimalist Strict Statistics Cards Grid -->
      <div class="grid grid-cols-3 gap-3 pr-2 sm:pr-0 select-none">
        <!-- Time Metric -->
        <div class="bg-smak-neutral-50/80 dark:bg-smak-neutral-800/40 border border-smak-neutral-200/60 dark:border-white/5 p-3.5 rounded-2xl text-center group hover:border-coral-400 dark:hover:border-coral-500/50 hover:bg-coral-500/5 transition-all duration-300">
          <UIcon name="i-lucide-clock" class="w-5 h-5 text-smak-neutral-500 dark:text-smak-neutral-400 mx-auto mb-1 group-hover:text-coral-500 transition-colors" />
          <p class="text-[10px] text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-widest font-black">Час</p>
          <p class="text-xs sm:text-sm text-smak-neutral-900 dark:text-white font-extrabold mt-0.5">
            {{ totalTime > 0 ? `${totalTime} хв` : '—' }}
          </p>
        </div>

        <!-- Difficulty Metric -->
        <div class="bg-smak-neutral-50/80 dark:bg-smak-neutral-800/40 border border-smak-neutral-200/60 dark:border-white/5 p-3.5 rounded-2xl text-center group hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-300">
          <UIcon name="i-lucide-award" class="w-5 h-5 text-smak-neutral-500 dark:text-smak-neutral-400 mx-auto mb-1 group-hover:text-amber-500 transition-colors" />
          <p class="text-[10px] text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-widest font-black">Рівень</p>
          <p class="text-xs sm:text-sm text-smak-neutral-900 dark:text-white font-extrabold mt-0.5">
            {{ translateDifficulty(recipe.difficulty) }}
          </p>
        </div>

        <!-- Health Metric -->
        <div class="bg-smak-neutral-50/80 dark:bg-smak-neutral-800/40 border border-smak-neutral-200/60 dark:border-white/5 p-3.5 rounded-2xl text-center group hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300">
          <UIcon name="i-lucide-apple" class="w-5 h-5 text-smak-neutral-500 dark:text-smak-neutral-400 mx-auto mb-1 group-hover:text-emerald-500 transition-colors" />
          <p class="text-[10px] text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-widest font-black">Здоров'я</p>
          <p class="text-xs sm:text-sm text-smak-neutral-900 dark:text-white font-extrabold mt-0.5">
            {{ recipe.healthScore }}%
          </p>
        </div>
      </div>

      <!-- Author/Chef details and CTA button -->
      <div class="pt-5 border-t border-smak-neutral-100 dark:border-smak-neutral-800 space-y-4 shrink-0">
        <div class="flex items-center justify-between">
          <NuxtLink 
            v-if="recipe.user?.id"
            :to="`/users/${recipe.user.id}`"
            class="flex items-center gap-3 hover:text-coral-500 dark:hover:text-coral-400 transition-colors cursor-pointer group/chef"
          >
            <UAvatar 
              :alt="recipe.user?.displayname || recipe.user?.username || 'Кухар'" 
              size="md"
              class="bg-smak-neutral-100 text-smak-neutral-700 dark:bg-smak-neutral-800 dark:text-smak-neutral-200 font-bold border border-smak-neutral-200/40 dark:border-white/5 group-hover/chef:ring-2 group-hover/chef:ring-coral-400/50 transition-all"
            />
            <div class="text-left">
              <p class="text-xs font-black uppercase tracking-wider text-smak-neutral-400 dark:text-smak-neutral-500">Шеф-кухар</p>
              <p class="text-base sm:text-lg text-smak-neutral-900 dark:text-white font-extrabold group-hover/chef:underline leading-tight">
                {{ recipe.user?.displayname || recipe.user?.username || 'SMAK Шеф' }}
              </p>
            </div>
          </NuxtLink>
          <div v-else class="flex items-center gap-3">
            <UAvatar 
              :alt="recipe.user?.displayname || recipe.user?.username || 'Кухар'" 
              size="md"
              class="bg-smak-neutral-100 text-smak-neutral-700 dark:bg-smak-neutral-800 dark:text-smak-neutral-200 font-bold border border-smak-neutral-200/40 dark:border-white/5"
            />
            <div class="text-left">
              <p class="text-xs font-black uppercase tracking-wider text-smak-neutral-400 dark:text-smak-neutral-500">Шеф-кухар</p>
              <p class="text-base sm:text-lg text-smak-neutral-900 dark:text-white font-extrabold leading-tight">
                {{ recipe.user?.displayname || recipe.user?.username || 'SMAK Шеф' }}
              </p>
            </div>
          </div>
          <span class="text-xs sm:text-sm text-smak-neutral-400 dark:text-smak-neutral-500 font-bold uppercase">
            {{ new Date(recipe.createdAt).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', year: 'numeric' }) }}
          </span>
        </div>

        <!-- Strict, Solid Action Button -->
        <div class="pt-1">
          <button 
            @click="emit('start-cooking')"
            class="w-full rounded-2xl bg-coral-500 hover:bg-coral-600 active:scale-98 text-white py-3.5 px-6 font-display font-extrabold text-xs sm:text-sm uppercase tracking-widest shadow-md hover:shadow-lg hover:shadow-coral-500/20 transition-all duration-300 select-none cursor-pointer flex items-center justify-center gap-2.5 focus:outline-none border-0"
          >
            <UIcon name="i-lucide-cooking-pot" class="w-5 h-5" />
            <span>Розпочати готування</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
