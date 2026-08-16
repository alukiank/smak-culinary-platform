<template>
  <div class="group bg-white dark:bg-smak-neutral-900 rounded-3xl overflow-hidden border border-smak-neutral-100 dark:border-smak-neutral-800 shadow-xs flex flex-col md:flex-row gap-6 p-4 animate-pulse">
    <!-- Image Skeleton -->
    <div class="relative h-48 md:h-auto md:w-64 overflow-hidden rounded-2xl shrink-0 bg-smak-neutral-50 dark:bg-smak-neutral-800/40"></div>

    <!-- Content Skeleton -->
    <div class="flex-1 flex flex-col min-w-0 py-1">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex-1 space-y-3">
          <div class="h-3 w-20 bg-coral-100 dark:bg-coral-950/20 rounded-full"></div>
          <div class="h-6 w-3/4 bg-smak-neutral-100 dark:bg-smak-neutral-800 rounded-lg"></div>
        </div>
        <div class="w-10 h-10 rounded-full bg-smak-neutral-50 dark:bg-smak-neutral-800"></div>
      </div>

      <div class="space-y-2 mb-6">
        <div class="h-4 w-full bg-smak-neutral-50 dark:bg-smak-neutral-800 rounded-lg"></div>
        <div class="h-4 w-5/6 bg-smak-neutral-50 dark:bg-smak-neutral-800 rounded-lg"></div>
      </div>

      <!-- Stats Grid Skeleton -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-auto pt-4 border-t border-smak-neutral-50 dark:border-smak-neutral-800/50">
        <div v-for="i in 4" :key="i" class="space-y-2">
          <div class="h-2 w-12 bg-smak-neutral-50 dark:bg-smak-neutral-800/60 rounded-full"></div>
          <div class="h-4 w-16 bg-smak-neutral-100 dark:bg-smak-neutral-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
</template>
