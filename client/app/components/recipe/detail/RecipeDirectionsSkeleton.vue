<script setup lang="ts">
// Skeleton for RecipeDirections.vue
</script>

<template>
  <div class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-pulse text-left">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 pb-4">
      <div class="space-y-1.5">
        <USkeleton class="h-6 w-44 rounded" />
        <USkeleton class="h-3 w-36 rounded" />
      </div>
      <USkeleton class="h-10 w-48 rounded-2xl" />
    </div>

    <div class="space-y-6">
      <div 
        v-for="i in 4" 
        :key="i"
        class="flex items-start gap-4"
      >
        <USkeleton class="w-8 h-8 rounded-full shrink-0" />
        <div class="space-y-2 flex-1 pt-1">
          <USkeleton class="h-4 w-full rounded" />
          <USkeleton class="h-4 w-5/6 rounded" />
          <USkeleton class="h-4 w-2/3 rounded" />
        </div>
      </div>
    </div>
  </div>
</template>
