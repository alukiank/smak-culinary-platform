<script setup lang="ts">
import { ref, computed } from 'vue'
import { translateAllergy } from '~/utils/formatters'

const selected = defineModel<string[]>({ default: () => [] })

const predefinedAllergies = [
  'Shellfish', 'Nuts', 'Peanuts', 'Soy', 'Wheat', 'Eggs', 'Milk', 'Fish', 'Gluten', 'Sesame'
]

const inputValue = ref('')

const toggleAllergy = (item: string) => {
  const idx = selected.value.indexOf(item)
  if (idx > -1) {
    selected.value.splice(idx, 1)
  } else {
    selected.value.push(item)
  }
}

const addCustomAllergy = () => {
  const clean = inputValue.value.trim()
  if (clean) {
    if (!selected.value.includes(clean)) {
      selected.value.push(clean)
    }
    inputValue.value = ''
  }
}

const removeCustomAllergy = (item: string) => {
  const idx = selected.value.indexOf(item)
  if (idx > -1) {
    selected.value.splice(idx, 1)
  }
}

const customAllergies = computed(() => {
  return selected.value.filter(a => !predefinedAllergies.includes(a))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2.5">
      <!-- Predefined active/inactive chips -->
      <button
        v-for="item in predefinedAllergies"
        :key="item"
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all duration-300 select-none cursor-pointer hover:scale-[1.03]"
        :class="[
          selected.includes(item)
            ? 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/20 shadow-xs'
            : 'bg-white/40 dark:bg-smak-neutral-900/20 border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-400 hover:border-coral-400 dark:hover:border-coral-500 hover:text-coral-500 dark:hover:text-coral-400 bg-transparent'
        ]"
        @click="toggleAllergy(item)"
      >
        <span class="text-sm select-none">{{ translateAllergy(item).icon }}</span>
        <span>{{ translateAllergy(item).label }}</span>
        <UIcon 
          v-if="selected.includes(item)" 
          name="i-lucide-check" 
          class="w-3.5 h-3.5 text-rose-500" 
        />
      </button>

      <!-- Custom Allergies (Active) -->
      <div
        v-for="allergy in customAllergies"
        :key="allergy"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40 shadow-xs select-none"
      >
        <span>⚠️</span>
        <span>{{ translateAllergy(allergy).label }}</span>
        <button 
          type="button" 
          class="hover:opacity-70 focus:outline-none ml-1 cursor-pointer transition-opacity flex items-center justify-center"
          @click="removeCustomAllergy(allergy)"
        >
          <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Empty Input Chip -->
      <div 
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm border border-dashed border-smak-neutral-300 dark:border-smak-neutral-700 bg-white/20 dark:bg-smak-neutral-900/10 hover:border-rose-400 dark:hover:border-rose-500/50 focus-within:border-rose-400 dark:focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-400/25 focus-within:bg-white dark:focus-within:bg-smak-neutral-900 transition-all duration-200 min-w-[140px]"
      >
        <UIcon name="i-lucide-plus" class="w-3.5 h-3.5 text-smak-neutral-400 shrink-0" />
        <input
          v-model="inputValue"
          type="text"
          placeholder="Інша..."
          class="bg-transparent border-0 outline-none p-0 text-xs sm:text-sm w-full text-smak-neutral-800 dark:text-white placeholder:text-smak-neutral-400 focus:ring-0 focus:outline-none"
          @keydown.enter.prevent="addCustomAllergy"
          @blur="addCustomAllergy"
        />
      </div>
    </div>
  </div>
</template>
