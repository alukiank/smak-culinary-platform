<script setup lang="ts">
// Skeleton for RecipePassport.vue
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
    <div 
      v-for="i in 4" 
      :key="i" 
      class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-3xl p-5 flex flex-col items-center text-center gap-3 shadow-xs"
    >
      <USkeleton class="w-12 h-12 rounded-2xl" />
      <div class="space-y-1.5 w-full flex flex-col items-center">
        <USkeleton class="h-3 w-16 rounded" />
        <USkeleton class="h-5 w-20 rounded" />
      </div>
    </div>
  </div>
</template>
