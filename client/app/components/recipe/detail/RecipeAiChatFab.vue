<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { RecipeResponseDto } from '~/types/recipe'
import CookModeAiChat from '~/components/recipe/modals/CookModeAiChat.vue'

const props = defineProps<{
  recipe: RecipeResponseDto
  missingIngredients?: string[]
  currentStep?: number
  hasSelection?: boolean
}>()

const isOpen = ref(false)
const fabContainerRef = ref<HTMLElement | null>(null)

const toggleChat = (e?: MouseEvent) => {
  if (e) e.stopPropagation()
  isOpen.value = !isOpen.value
}

// Lock body scrolling when chat modal is open to prevent iOS from scrolling the recipe page behind the keyboard
watch(isOpen, (val) => {
  if (import.meta.client) {
    if (val) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }
})

const handleDocumentClick = (event: MouseEvent) => {
  if (!isOpen.value) return
  const target = event.target as Node
  if (!target || !document.body.contains(target)) return
  if (fabContainerRef.value && !fabContainerRef.value.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (import.meta.client) {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})
</script>

<template>
  <div ref="fabContainerRef" class="select-none">
    <!-- Backdrop (Mobile: strictly below header at top-16; Desktop: full overlay) -->
    <Transition name="fade">
      <div 
        v-if="isOpen"
        class="fixed top-16 inset-x-0 bottom-0 sm:top-0 sm:inset-0 z-40 bg-white dark:bg-smak-neutral-950 sm:bg-black/40 sm:dark:bg-black/70 backdrop-blur-xs cursor-pointer"
        aria-hidden="true"
        @click="isOpen = false"
      />
    </Transition>

    <!-- Floating Minimalist AI Chat Window (Mobile: starts below header top-16; Desktop: floating 420x540 window) -->
    <Transition name="pop-in">
      <div 
        v-if="isOpen"
        class="fixed top-16 inset-x-0 bottom-0 sm:top-auto sm:bottom-24 sm:left-auto sm:right-8 xl:right-[calc((100vw-80rem)/2+1.5rem)] z-50 w-full sm:w-[420px] h-[calc(100dvh-4rem)] sm:h-[540px] max-h-[calc(100dvh-4rem)] sm:max-h-[540px] rounded-none sm:rounded-3xl overflow-hidden bg-white dark:bg-smak-neutral-900 border-t border-smak-neutral-200/80 dark:border-smak-neutral-800 sm:border shadow-2xl flex flex-col transition-all duration-300"
      >
        <CookModeAiChat 
          :recipe="recipe" 
          :missing-ingredients="missingIngredients || []" 
          :current-step="currentStep || 0"
          :hide-header="true"
          @close="isOpen = false"
        />
      </div>
    </Transition>

    <!-- Universal Floating FAB Button (Hidden on mobile when chat is open; Always visible on desktop) -->
    <div 
      class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 xl:right-[calc((100vw-80rem)/2+1.5rem)] z-[60]"
      :class="{ 'hidden sm:block': isOpen }"
    >
      <button
        @click.stop="toggleChat"
        type="button"
        class="relative group w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-linear-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer transition-all duration-300 border-0 focus:outline-none"
        :aria-label="isOpen ? 'Закрити ШІ-чат' : 'Відкрити ШІ-асистента'"
      >
        <!-- Shimmer effect -->
        <span class="absolute inset-0 rounded-full bg-white/20 animate-pulse pointer-events-none"></span>

        <!-- Attention dot (only shown when user starts selecting ingredients & chat closed) -->
        <span v-if="!isOpen && hasSelection" class="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white dark:border-smak-neutral-900"></span>
        </span>

        <!-- Icon: Sparkles when closed, X when open -->
        <UIcon 
          :name="isOpen ? 'i-lucide-x' : 'i-lucide-sparkles'" 
          class="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-300"
          :class="{ 'rotate-90': isOpen }"
        />

        <!-- Hover Tooltip Label -->
        <span 
          v-if="!isOpen" 
          class="hidden sm:flex absolute right-full mr-3 px-3.5 py-1.5 rounded-xl bg-smak-neutral-900 dark:bg-white text-white dark:text-smak-neutral-900 text-xs font-bold whitespace-nowrap shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
        >
          ШІ-Кулінарний помічник
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pop-in-enter-active,
.pop-in-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.pop-in-enter-from,
.pop-in-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}
.pop-in-enter-to,
.pop-in-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
