<script setup lang="ts">
import type { RecipeCollectionResponseDto } from '~/types/collection'
import { useCollections } from '~/composables/useCollections'

const props = defineProps<{
  recipeId: string
  recipeTitle: string
}>()

const emit = defineEmits(['close'])

const { 
  getCollections, 
  addRecipeToCollection, 
  removeRecipeFromCollection,
  recipeToCollectionsMap,
  refreshCollectionsMap 
} = useCollections()

const collections = ref<RecipeCollectionResponseDto[]>([])
const isLoading = ref(true)

const fetchCollectionsData = async () => {
  isLoading.value = true
  try {
    // We fetch the list of collections to display them
    const list = await getCollections()
    collections.value = list
    
    // Ensure the global map is up to date
    await refreshCollectionsMap()
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchCollectionsData)

const isRecipeInCollection = (collectionId: string) => {
  return recipeToCollectionsMap.value[props.recipeId]?.includes(collectionId) || false
}

const handleToggleCollection = async (collection: RecipeCollectionResponseDto) => {
  const inCollection = isRecipeInCollection(collection.id)
  
  try {
    if (inCollection) {
      await removeRecipeFromCollection(collection.id, props.recipeId)
      collection.recipesCount = Math.max(0, collection.recipesCount - 1)
    } else {
      await addRecipeToCollection(collection.id, props.recipeId)
      collection.recipesCount++
    }
  } catch (error) {
    // Error handled in composable
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <UModal :ui="{ content: 'sm:max-w-md rounded-3xl overflow-hidden' }">
    <template #content>
      <div class="bg-white dark:bg-smak-neutral-900 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Background Decoration (Subtle) -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-coral-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Header -->
        <div class="p-6 sm:p-8 pb-2 sm:pb-2 border-smak-neutral-100 dark:border-smak-neutral-800/50 relative z-10 text-left">
          <div class="flex items-start justify-between gap-4">
            <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              Додати до колекції
            </h3>
            <UButton 
              color="neutral" 
              variant="ghost" 
              icon="i-lucide-x" 
              class="rounded-full -mt-1 -mr-1 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800" 
              @click="handleClose" 
            />
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 sm:p-8 pt-4 sm:pt-4 custom-scrollbar relative z-10 text-left">
          <div v-if="isLoading" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-2xl" />
          </div>
          
          <div v-else-if="collections.length === 0" class="text-center py-10">
            <div class="w-16 h-16 bg-smak-neutral-50 dark:bg-smak-neutral-800 rounded-full flex items-center justify-center text-smak-neutral-300 dark:text-smak-neutral-600 mx-auto mb-4">
              <UIcon name="i-lucide-bookmark" class="w-8 h-8" />
            </div>
            <p class="text-sm font-bold text-smak-neutral-500 dark:text-smak-neutral-400">У вас ще немає колекцій</p>
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="collection in collections" 
              :key="collection.id"
              class="group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none"
              :class="[
                isRecipeInCollection(collection.id)
                  ? 'border-coral-500/50 bg-coral-500/5 dark:bg-coral-500/10'
                  : 'border-smak-neutral-100 dark:border-smak-neutral-800 hover:border-coral-200 dark:hover:border-coral-900/30 hover:bg-coral-50/30 dark:hover:bg-coral-950/10'
              ]"
              @click="handleToggleCollection(collection)"
            >
              <div class="flex items-center gap-4">
                <div 
                  class="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                  :class="[
                    isRecipeInCollection(collection.id)
                      ? 'bg-coral-500 text-white scale-110 shadow-lg shadow-coral-500/20'
                      : 'bg-coral-50 dark:bg-coral-950/30 text-coral-500 group-hover:scale-105'
                  ]"
                >
                  <UIcon 
                    :name="isRecipeInCollection(collection.id) ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'" 
                    class="w-6 h-6" 
                  />
                </div>
                <div>
                  <p class="text-sm font-bold transition-colors" :class="isRecipeInCollection(collection.id) ? 'text-coral-600 dark:text-coral-400' : 'text-smak-neutral-900 dark:text-white'">
                    {{ collection.name }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span 
                  v-if="isRecipeInCollection(collection.id)"
                  class="text-[9px] font-black uppercase tracking-widest text-coral-500 bg-coral-500/10 px-2 py-0.5 rounded-full"
                >
                  Додано
                </span>
                <div 
                  class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                  :class="[
                    isRecipeInCollection(collection.id)
                      ? 'border-coral-500 bg-coral-500 text-white'
                      : 'border-smak-neutral-200 dark:border-smak-neutral-700'
                  ]"
                >
                  <UIcon v-if="isRecipeInCollection(collection.id)" name="i-lucide-check" class="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-smak-neutral-100 dark:border-smak-neutral-800/50 bg-smak-neutral-50/50 dark:bg-smak-neutral-800/20 relative z-10">
          <UButton 
            label="Готово" 
            color="neutral" 
            variant="solid"
            class="w-full justify-center rounded-xl py-3 font-bold shadow-lg shadow-smak-neutral-500/5 cursor-pointer" 
            @click="handleClose" 
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937;
}
</style>
