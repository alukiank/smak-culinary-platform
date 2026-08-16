<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  ingredients: string[]
}>()

const emit = defineEmits<{
  (e: 'selection-change', payload: { hasSelection: boolean; missingIngredients: string[] }): void
}>()

const checkedIngredients = ref<Record<string, boolean>>({})

const toggleIngredient = (ing: string) => {
  checkedIngredients.value[ing] = !checkedIngredients.value[ing]
  const checkedCount = Object.values(checkedIngredients.value).filter(Boolean).length
  const hasSelection = checkedCount > 0
  const missing = props.ingredients.filter(i => !checkedIngredients.value[i])
  emit('selection-change', { hasSelection, missingIngredients: missing })
}
</script>

<template>
  <div class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100/50 dark:border-white/5 rounded-4xl p-6 sm:p-8 shadow-xs text-left flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-heading font-bold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white flex items-center gap-2.5">
          <UIcon name="i-lucide-list-checks" class="w-6 h-6 text-coral-500" />
          <span>Інгредієнти</span>
        </h2>
        <span class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 font-black uppercase bg-smak-neutral-50 dark:bg-smak-neutral-800 px-3 py-1.5 rounded-xl border border-smak-neutral-100/50 dark:border-white/5">
          {{ ingredients.length }} компонентів
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
        <label 
          v-for="(ing, idx) in ingredients" 
          :key="idx"
          class="relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-smak-neutral-50/80 hover:bg-smak-neutral-100/80 dark:bg-smak-neutral-800/40 dark:hover:bg-smak-neutral-800/80 cursor-pointer transition-all duration-200 border border-smak-neutral-200/60 dark:border-white/5 hover:border-coral-300 dark:hover:border-coral-500/40 select-none"
          :class="[checkedIngredients[ing] ? 'border-coral-300/80 bg-coral-50/20 dark:bg-coral-950/20 dark:border-coral-900/40' : '']"
        >
          <div class="relative flex items-center justify-center">
            <input 
              type="checkbox"
              :checked="checkedIngredients[ing]"
              @change="toggleIngredient(ing)"
              class="peer sr-only"
            />
            <div 
              class="w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all duration-200"
              :class="[
                checkedIngredients[ing] 
                  ? 'border-coral-500 bg-coral-50/90 dark:bg-coral-950/40' 
                  : 'border-smak-neutral-300 dark:border-smak-neutral-600 bg-white dark:bg-smak-neutral-800'
              ]"
            >
              <UIcon 
                v-if="checkedIngredients[ing]" 
                name="i-lucide-check" 
                class="w-4 h-4 text-coral-500 font-black stroke-[3]" 
              />
            </div>
          </div>
          <span 
            class="text-sm sm:text-base leading-relaxed transition-all duration-200"
            :class="[checkedIngredients[ing] ? 'line-through text-smak-neutral-400 dark:text-smak-neutral-500 font-medium' : 'text-smak-neutral-800 dark:text-smak-neutral-100 font-semibold']"
          >
            {{ ing }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>
