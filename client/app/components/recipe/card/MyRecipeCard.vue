<script setup lang="ts">
import RecipeAddToCollectionModal from '~/components/recipe/modals/RecipeAddToCollectionModal.vue'
import type { RecipeResponseDto, RecipeStatus } from '~/types/recipe'
import { useUser } from '~/composables/useUser'
import { 
  translateCategory, 
  translateDifficulty,
  translateStatus,
  formatDate
} from '~/utils/formatters'

const props = defineProps<{
  recipe: RecipeResponseDto
}>()

const emit = defineEmits<{
  (e: 'edit', recipe: RecipeResponseDto): void
  (e: 'delete', id: string): void
  (e: 'archive', id: string): void
  (e: 'unarchive', id: string): void
  (e: 'draft', id: string): void
  (e: 'publish', id: string): void
}>()

// Status colors mapping
const statusConfig = computed(() => {
  const configs: Record<RecipeStatus, { color: 'success' | 'neutral' | 'warning' | 'error' | 'primary' | 'ai-indigo', icon: string }> = {
    public: { color: 'success', icon: 'i-lucide-globe' },
    draft: { color: 'neutral', icon: 'i-lucide-file-text' },
    archived: { color: 'warning', icon: 'i-lucide-archive' },
    rejected: { color: 'error', icon: 'i-lucide-x-circle' },
    premoderation: { color: 'primary', icon: 'i-lucide-clock' },
    moderation: { color: 'ai-indigo', icon: 'i-lucide-shield-check' }
  }
  return configs[props.recipe.status] || configs.draft
})

const { user } = useUser()
const isCollectionModalOpen = ref(false)
const overlay = useOverlay()

const items = computed(() => {
  const group1 = [
    {
      label: 'Переглянути',
      icon: 'i-lucide-eye',
      to: `/recipes/${props.recipe.id}`
    }, {
      label: 'Редагувати',
      icon: 'i-lucide-edit',
      onSelect: () => emit('edit', props.recipe)
    }
  ]

  const group2 = []

  if (props.recipe.status === 'draft') {
    group2.push({
      label: 'Опублікувати',
      icon: 'i-lucide-send',
      onSelect: () => emit('publish', props.recipe.id)
    })
  }

  group2.push({
    label: props.recipe.status === 'archived' ? 'Розархівувати' : 'Архівувати',
    icon: props.recipe.status === 'archived' ? 'i-lucide-archive-restore' : 'i-lucide-archive',
    onSelect: () => props.recipe.status === 'archived' ? emit('unarchive', props.recipe.id) : emit('archive', props.recipe.id)
  })

  group2.push({
    label: 'У чернетку',
    icon: 'i-lucide-file-text',
    disabled: props.recipe.status === 'draft',
    onSelect: () => emit('draft', props.recipe.id)
  })

  const group3 = [
    {
      label: 'Видалити',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => emit('delete', props.recipe.id)
    }
  ]

  return [group1, group2, group3]
})
</script>

<template>
  <div class="group bg-white dark:bg-smak-neutral-900 rounded-3xl overflow-hidden border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:h-56 gap-6 p-4">
    
    <!-- Image Section -->
    <div class="relative h-48 md:h-full md:w-64 overflow-hidden rounded-2xl shrink-0">
      <SharedCloudImage 
        :public-id="recipe.coverImageId" 
        :alt="recipe.title"
        :width="600"
        aspect="auto"
        class="w-full h-full object-cover"
      />
      
      <!-- Status Badge Overlay -->
      <div class="absolute top-3 left-3">
        <UBadge 
          :color="statusConfig.color" 
          variant="subtle"
          class="backdrop-blur-md bg-white/80 dark:bg-black/40 font-bold uppercase text-[10px] tracking-wider py-1 px-2.5 rounded-lg border border-current/10 shadow-sm"
        >
          <template #leading>
            <UIcon :name="statusConfig.icon" class="w-3 h-3 mr-1" />
          </template>
          {{ translateStatus(recipe.status) }}
        </UBadge>
      </div>
    </div>

    <!-- Content Section -->
    <div class="flex-1 flex flex-col min-w-0 py-1">
      <div class="flex items-start justify-between gap-4 mb-2">
        <div class="min-w-0">
          <p class="text-[11px] font-black uppercase tracking-widest text-coral-500 mb-1">
            {{ translateCategory(recipe.category) }}
          </p>
          <h3 class="font-heading font-bold text-xl text-smak-neutral-900 dark:text-white truncate group-hover:text-coral-500 transition-colors">
            <NuxtLink :to="`/recipes/${recipe.id}`">
              {{ recipe.title }}
            </NuxtLink>
          </h3>
        </div>
        
        <div class="relative z-20">
          <UDropdownMenu :items="items" :content="{ align: 'end' }">
            <UButton 
              color="neutral" 
              variant="ghost" 
              icon="i-lucide-more-vertical" 
              class="rounded-full"
              aria-label="Опції рецепту"
            />
          </UDropdownMenu>
        </div>
      </div>

      <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 line-clamp-2 mb-4 leading-relaxed">
        {{ recipe.description }}
      </p>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-auto pt-4 border-t border-smak-neutral-50 dark:border-smak-neutral-800/50">
        <div class="flex flex-col">
          <span class="text-[10px] uppercase font-bold text-smak-neutral-400 tracking-tighter">Рейтинг</span>
          <div class="flex items-center gap-1 mt-0.5">
            <UIcon name="i-lucide-star" class="w-3.5 h-3.5 text-yellow-500 fill-current" />
            <span class="text-sm font-bold text-smak-neutral-700 dark:text-smak-neutral-200">{{ (recipe.rating || 0).toFixed(1) }}</span>
          </div>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] uppercase font-bold text-smak-neutral-400 tracking-tighter">Відгуки</span>
          <div class="flex items-center gap-1 mt-0.5">
            <UIcon name="i-lucide-message-square" class="w-3.5 h-3.5 text-coral-500" />
            <span class="text-sm font-bold text-smak-neutral-700 dark:text-smak-neutral-200">{{ recipe.numRatings }}</span>
          </div>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] uppercase font-bold text-smak-neutral-400 tracking-tighter">Складність</span>
          <div class="flex items-center gap-1 mt-0.5">
            <div 
              class="w-2 h-2 rounded-full" 
              :class="[
                recipe.difficulty === 'easy' ? 'bg-green-500' : 
                recipe.difficulty === 'medium' ? 'bg-orange-500' : 'bg-red-500'
              ]"
            ></div>
            <span class="text-xs font-bold text-smak-neutral-700 dark:text-smak-neutral-200">{{ translateDifficulty(recipe.difficulty) }}</span>
          </div>
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] uppercase font-bold text-smak-neutral-400 tracking-tighter">Оновлено</span>
          <span class="text-xs font-bold text-smak-neutral-700 dark:text-smak-neutral-200 mt-0.5 truncate">{{ formatDate(recipe.updatedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
