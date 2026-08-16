<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  page: number
  total: number
  itemsPerPage?: number
  siblingCount?: number
  prevText?: string
  nextText?: string
}>(), {
  itemsPerPage: 12,
  siblingCount: 1,
  prevText: 'Назад',
  nextText: 'Далі'
})

const emit = defineEmits<{
  (e: 'update:page', value: number): void
}>()

const totalPages = computed(() => {
  if (props.total <= 0) return 0
  return Math.ceil(props.total / props.itemsPerPage)
})

const setPage = (p: number) => {
  if (p >= 1 && p <= totalPages.value && p !== props.page) {
    emit('update:page', p)
  }
}

// Generate pagination pages list with ellipsis (e.g. [1, 2, 3, '...', 26])
const pages = computed(() => {
  const current = props.page
  const last = totalPages.value
  const delta = props.siblingCount
  const left = current - delta
  const right = current + delta + 1
  const range: number[] = []
  const rangeWithDots: (number | string)[] = []
  let l: number | undefined

  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= left && i < right)) {
      range.push(i)
    }
  }

  for (const i of range) {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l > 2) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
})
</script>

<template>
  <div 
    v-if="totalPages > 1" 
    class="flex items-center justify-between w-full select-none gap-1 sm:gap-2"
  >
    <!-- Left side: Previous Control Button -->
    <div class="flex-1 flex justify-start">
      <button
        v-if="page > 1"
        type="button"
        @click="setPage(page - 1)"
        class="group flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:py-2 sm:px-3 text-sm font-bold text-smak-neutral-500 dark:text-smak-neutral-400 hover:text-coral-500 dark:hover:text-coral-400 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 sm:hover:bg-transparent sm:dark:hover:bg-transparent transition-all focus:outline-none cursor-pointer bg-transparent border-none rounded-xl"
      >
        <UIcon 
          name="i-lucide-chevron-left" 
          class="w-5 h-5 transition-transform group-hover:-translate-x-0.5 duration-200 shrink-0" 
        />
        <span class="hidden sm:inline-block text-sm">{{ prevText }}</span>
      </button>
      <div v-else class="w-10 sm:w-16"></div>
    </div>

    <!-- Center: Page Numbers -->
    <div class="flex items-center gap-1 sm:gap-1.5 justify-center mx-1 sm:mx-6">
      <template v-for="(p, idx) in pages" :key="idx">
        <!-- Number Button -->
        <button
          v-if="typeof p === 'number'"
          type="button"
          @click="setPage(p)"
          class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm transition-all duration-200 focus:outline-none rounded-xl"
          :class="[
            p === page
              ? 'border border-coral-500/80 dark:border-coral-400/80 text-coral-500 dark:text-coral-400 font-extrabold bg-white dark:bg-smak-neutral-800/50 shadow-sm'
              : 'font-semibold text-smak-neutral-500 dark:text-smak-neutral-400 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 hover:text-smak-neutral-800 dark:hover:text-white cursor-pointer bg-transparent border-none'
          ]"
        >
          {{ p }}
        </button>

        <!-- Ellipsis -->
        <span
          v-else
          class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-semibold text-smak-neutral-400 dark:text-smak-neutral-500"
        >
          {{ p }}
        </span>
      </template>
    </div>

    <!-- Right side: Next Control Button -->
    <div class="flex-1 flex justify-end">
      <button
        v-if="page < totalPages"
        type="button"
        @click="setPage(page + 1)"
        class="group flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:px-5 sm:py-2.5 text-sm font-extrabold text-white bg-coral-500 hover:bg-coral-600 dark:bg-coral-600 dark:hover:bg-coral-700 shadow-md shadow-coral-500/10 hover:shadow-coral-500/20 active:scale-[0.98] transition-all rounded-xl focus:outline-none cursor-pointer border-none shrink-0"
      >
        <span class="hidden sm:inline-block text-xs sm:text-sm">{{ nextText }}</span>
        <UIcon 
          name="i-lucide-chevron-right" 
          class="w-5 h-5 transition-transform group-hover:translate-x-0.5 duration-200 shrink-0" 
        />
      </button>
      <div v-else class="w-10 sm:w-16"></div>
    </div>
  </div>
</template>
