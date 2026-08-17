<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import type { ChatMessageRecipeRef } from '~/types/chat'

interface Props {
  recipes: ChatMessageRecipeRef[]
  animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animate: false,
})

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(props.recipes.length > 3)

const checkScroll = () => {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  canScrollLeft.value = el.scrollLeft > 5
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
}

const scroll = (direction: 'left' | 'right') => {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  const firstCard = el.querySelector('.slider-card') as HTMLElement | null
  const cardWidth = firstCard ? firstCard.offsetWidth : 300
  const gap = 12
  const scrollAmount = direction === 'left' ? -(cardWidth + gap) * 2 : (cardWidth + gap) * 2
  
  el.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  })
}

// Add event listeners
onMounted(() => {
  nextTick(() => {
    checkScroll()
    setTimeout(checkScroll, 300)
    setTimeout(checkScroll, 800)
  })
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', checkScroll)
  }
  window.addEventListener('resize', checkScroll)
})

onBeforeUnmount(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', checkScroll)
  }
  window.removeEventListener('resize', checkScroll)
})

watch(() => props.recipes, () => {
  nextTick(() => {
    checkScroll()
    setTimeout(checkScroll, 300)
    setTimeout(checkScroll, 800)
  })
}, { deep: true })
</script>

<template>
  <div class="relative w-full group/slider my-3.5" @mouseenter="checkScroll">
    <!-- Left scroll button -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <button
        v-if="canScrollLeft"
        type="button"
        class="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/95 dark:bg-smak-neutral-800/95 text-coral-500 dark:text-coral-400 shadow-xl shadow-black/15 border-2 border-coral-500/40 dark:border-coral-500/50 hover:bg-coral-500 hover:text-white dark:hover:bg-coral-500 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md"
        aria-label="Попередні рецепти"
        @click="scroll('left')"
      >
        <UIcon name="i-lucide-chevron-left" class="w-5 h-5" />
      </button>
    </Transition>

    <!-- Right scroll button -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <button
        v-if="canScrollRight"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/95 dark:bg-smak-neutral-800/95 text-coral-500 dark:text-coral-400 shadow-xl shadow-black/15 border-2 border-coral-500/40 dark:border-coral-500/50 hover:bg-coral-500 hover:text-white dark:hover:bg-coral-500 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md"
        aria-label="Наступні рецепти"
        @click="scroll('right')"
      >
        <UIcon name="i-lucide-chevron-right" class="w-5 h-5" />
      </button>
    </Transition>

    <!-- Scrollable container -->
    <div
      ref="scrollContainer"
      class="flex flex-row flex-nowrap items-stretch overflow-x-auto overflow-y-hidden gap-3 pb-2.5 pt-1 custom-scrollbar w-full scroll-smooth"
      :class="[
        recipes.length > 3 ? 'slider-many' : 'slider-three',
        {
          'mask-both': canScrollLeft && canScrollRight,
          'mask-left': canScrollLeft && !canScrollRight,
          'mask-right': !canScrollLeft && canScrollRight
        }
      ]"
      @scroll="checkScroll"
    >
      <ChatRecipeCard
        v-for="(recipe, index) in recipes"
        :key="recipe.id"
        :recipe="recipe"
        class="slider-card"
        :animate="animate"
        :style="{ animationDelay: `${index * 80}ms` }"
      />
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-smak-neutral-200);
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-smak-neutral-800);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-coral-400);
}

/* Edge fading gradients */
.mask-both {
  mask-image: linear-gradient(to right, transparent, black 28px, black calc(100% - 28px), transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 28px, black calc(100% - 28px), transparent);
}
.mask-right {
  mask-image: linear-gradient(to right, black, black calc(100% - 28px), transparent);
  -webkit-mask-image: linear-gradient(to right, black, black calc(100% - 28px), transparent);
}
.mask-left {
  mask-image: linear-gradient(to right, transparent, black 28px, black);
  -webkit-mask-image: linear-gradient(to right, transparent, black 28px, black);
}

:deep(.slider-card) {
  width: calc((100% - 10px) / 1.25) !important;
  min-width: 200px;
  flex-shrink: 0;
}

@media (min-width: 540px) {
  :deep(.slider-card) {
    width: calc((100% - 16px) / 2.2) !important;
    min-width: 0;
  }
}

@media (min-width: 860px) {
  .slider-three :deep(.slider-card) {
    width: calc((100% - 24px) / 3) !important;
    min-width: 0;
  }
  .slider-many :deep(.slider-card) {
    width: calc((100% - 24px) / 3.2) !important;
    min-width: 0;
  }
}
</style>
