<script setup lang="ts">
// Skeleton for RecipeIngredients.vue
</script>

<template>
  <div class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-pulse text-left">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 pb-4">
      <div class="space-y-1.5">
        <USkeleton class="h-6 w-32 rounded" />
        <USkeleton class="h-3 w-24 rounded" />
      </div>
      <USkeleton class="h-10 w-36 rounded-xl" />
    </div>

    <div class="space-y-3">
      <div 
        v-for="i in 5" 
        :key="i"
        class="flex items-center justify-between p-3.5 rounded-2xl bg-smak-neutral-50 dark:bg-smak-neutral-800/40"
      >
        <div class="flex items-center gap-3">
          <USkeleton class="w-5 h-5 rounded-md" />
          <USkeleton class="h-4 w-40 sm:w-60 rounded" />
        </div>
        <USkeleton class="h-4 w-16 rounded font-semibold" />
      </div>
    </div>
  </div>
</template>
