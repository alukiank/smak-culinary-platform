<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  debounceMs?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}>()

const internalValue = ref(props.modelValue)

// Sync internal value with prop
watch(() => props.modelValue, (newVal) => {
  if (newVal !== internalValue.value) {
    internalValue.value = newVal
  }
})

let timeout: any = null

// Watch internal value and emit update
watch(internalValue, (newVal) => {
  emit('update:modelValue', newVal)
  
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    emit('search', newVal)
  }, props.debounceMs || 500)
})

const handleSubmit = () => {
  if (timeout) clearTimeout(timeout)
  emit('search', internalValue.value)
}

const clearSearch = () => {
  internalValue.value = ''
  if (timeout) clearTimeout(timeout)
  emit('search', '')
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="w-full h-full min-h-0 flex items-stretch">
    <UInput 
      v-model="internalValue" 
      icon="i-lucide-search" 
      :placeholder="placeholder || 'Пошук...'" 
      variant="none"
      size="lg"
      class="w-full h-full min-h-[42px] bg-smak-neutral-50 dark:bg-smak-neutral-800/50 rounded-full border border-smak-neutral-200 dark:border-smak-neutral-700/50 focus-within:border-coral-500/50 transition-colors flex items-center px-4"
      :ui="{ root: 'w-full h-full flex items-center', base: 'text-sm sm:text-base h-full flex items-center' }"
    >
      <template #trailing v-if="internalValue">
        <button 
          type="button" 
          @click="clearSearch"
          class="p-1 rounded-full hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 text-smak-neutral-400 hover:text-smak-neutral-600 focus:outline-none transition-colors shrink-0"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </template>
    </UInput>
  </form>
</template>
