<script setup lang="ts">
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'smak_demo_notice_dismissed'
const isOpen = ref(false)

onMounted(() => {
  try {
    const isDismissed = localStorage.getItem(STORAGE_KEY)
    if (!isDismissed) {
      setTimeout(() => {
        isOpen.value = true
      }, 500)
    }
  } catch (e) {
    console.error('LocalStorage access error:', e)
  }
})

const handleDismiss = () => {
  isOpen.value = false
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch (e) {
    console.error('LocalStorage write error:', e)
  }
}
</script>

<template>
  <UModal 
    v-model:open="isOpen"
    :ui="{
      overlay: 'z-[100] backdrop-blur-sm bg-black/40',
      content: 'z-[100] sm:max-w-md rounded-3xl sm:rounded-4xl border-0 bg-transparent shadow-2xl overflow-hidden'
    }"
  >
    <template #content>
      <div class="relative bg-white dark:bg-smak-neutral-900 p-6 sm:p-7 rounded-3xl sm:rounded-4xl border border-smak-neutral-200/80 dark:border-smak-neutral-800 shadow-2xl space-y-4 text-left w-full">
        <!-- Absolute Close Button in Top-Right Corner -->
        <button
          type="button"
          class="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full flex items-center justify-center text-smak-neutral-400 hover:text-smak-neutral-700 dark:hover:text-smak-neutral-200 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 transition-colors cursor-pointer z-10"
          aria-label="Закрити"
          @click="handleDismiss"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>

        <!-- Header with Title -->
        <div class="pt-1">
          <h3 class="text-xl sm:text-2xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight pr-8">
            Демонстраційна версія
          </h3>
        </div>

        <!-- Body description -->
        <p class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-300 leading-relaxed font-medium">
          Вітаємо на кулінарній платформі <strong>SMAK</strong>! Цей веб-застосунок створено як <strong>некомерційний проєкт для портфоліо розробника </strong> (<a href="https://github.com/alukiank" target="_blank" rel="noopener noreferrer" class="text-coral-500 hover:underline font-bold">GitHub Profile</a>).
        </p>

        <!-- Links to Terms & Privacy in bottom right -->
        <div class="flex items-center justify-end gap-2 text-xs text-smak-neutral-400 dark:text-smak-neutral-500 pt-2">
          <NuxtLink 
            to="/terms" 
            class="hover:text-coral-500 dark:hover:text-coral-400 hover:underline transition-colors"
            @click="handleDismiss"
          >
            Умови використання
          </NuxtLink>
          <span>•</span>
          <NuxtLink 
            to="/privacy" 
            class="hover:text-coral-500 dark:hover:text-coral-400 hover:underline transition-colors"
            @click="handleDismiss"
          >
            Конфіденційність
          </NuxtLink>
        </div>
      </div>
    </template>
  </UModal>
</template>
