<script setup lang="ts">
// Skeleton for RecipeFilterPanel.vue
</script>

<template>
  <div class="space-y-6 animate-pulse text-left">
    <!-- Search Bar -->
    <div class="flex flex-col md:flex-row gap-4">
      <USkeleton class="h-12 flex-1 rounded-2xl" />
      <USkeleton class="h-12 w-full md:w-40 rounded-2xl" />
      <USkeleton class="h-12 w-12 rounded-2xl" />
    </div>

    <!-- Category Pills -->
    <div class="flex gap-2 overflow-hidden pb-2">
      <USkeleton v-for="i in 6" :key="i" class="h-10 w-28 rounded-xl shrink-0" />
    </div>
  </div>
</template>
