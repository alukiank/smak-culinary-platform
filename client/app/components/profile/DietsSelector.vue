<script setup lang="ts">
import { ref, computed } from 'vue'
import { translateDietary } from '~/utils/formatters'

const selected = defineModel<string[]>({ default: () => [] })

const predefinedDietary = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Dairy-Free', 'Nut-Free', 'Low-Carb', 'Keto'
]

const inputValue = ref('')

const toggleDiet = (item: string) => {
  const idx = selected.value.indexOf(item)
  if (idx > -1) {
    selected.value.splice(idx, 1)
  } else {
    selected.value.push(item)
  }
}

const addCustomDiet = () => {
  const clean = inputValue.value.trim()
  if (clean) {
    if (!selected.value.includes(clean)) {
      selected.value.push(clean)
    }
    inputValue.value = ''
  }
}

const removeCustomDiet = (item: string) => {
  const idx = selected.value.indexOf(item)
  if (idx > -1) {
    selected.value.splice(idx, 1)
  }
}

const customDiets = computed(() => {
  return selected.value.filter(d => !predefinedDietary.includes(d))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2.5">
      <!-- Predefined active/inactive chips -->
      <button
        v-for="item in predefinedDietary"
        :key="item"
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all duration-300 select-none cursor-pointer hover:scale-[1.03]"
        :class="[
          selected.includes(item)
            ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 shadow-xs'
            : 'bg-white/40 dark:bg-smak-neutral-900/20 border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-400 hover:border-coral-400 dark:hover:border-coral-500 hover:text-coral-500 dark:hover:text-coral-400 bg-transparent'
        ]"
        @click="toggleDiet(item)"
      >
        <span class="text-sm select-none">{{ translateDietary(item).icon }}</span>
        <span>{{ translateDietary(item).label }}</span>
        <UIcon 
          v-if="selected.includes(item)" 
          name="i-lucide-check" 
          class="w-3.5 h-3.5 text-emerald-500" 
        />
      </button>

      <!-- Custom Diets (Active) -->
      <div
        v-for="diet in customDiets"
        :key="diet"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-xs select-none"
      >
        <span>🍽️</span>
        <span>{{ translateDietary(diet).label }}</span>
        <button 
          type="button" 
          class="hover:opacity-70 focus:outline-none ml-1 cursor-pointer transition-opacity flex items-center justify-center"
          @click="removeCustomDiet(diet)"
        >
          <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Empty Input Chip -->
      <div 
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm border border-dashed border-smak-neutral-300 dark:border-smak-neutral-700 bg-white/20 dark:bg-smak-neutral-900/10 hover:border-emerald-400 dark:hover:border-emerald-500/50 focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-400/25 focus-within:bg-white dark:focus-within:bg-smak-neutral-900 transition-all duration-200 min-w-[140px]"
      >
        <UIcon name="i-lucide-plus" class="w-3.5 h-3.5 text-smak-neutral-400 shrink-0" />
        <input
          v-model="inputValue"
          type="text"
          placeholder="Інша..."
          class="bg-transparent border-0 outline-none p-0 text-xs sm:text-sm w-full text-smak-neutral-800 dark:text-white placeholder:text-smak-neutral-400 focus:ring-0 focus:outline-none"
          @keydown.enter.prevent="addCustomDiet"
          @blur="addCustomDiet"
        />
      </div>
    </div>
  </div>
</template>
