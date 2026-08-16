<script setup lang="ts">
// Skeleton for RecipeHero.vue
</script>

<template>
  <div class="space-y-6 animate-pulse text-left">
    <!-- Breadcrumb skeleton -->
    <div class="flex items-center gap-2">
      <USkeleton class="h-4 w-16 rounded" />
      <span class="text-smak-neutral-300 dark:text-smak-neutral-700">/</span>
      <USkeleton class="h-4 w-24 rounded" />
      <span class="text-smak-neutral-300 dark:text-smak-neutral-700">/</span>
      <USkeleton class="h-4 w-32 rounded" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Info Left Side -->
      <div class="lg:col-span-7 space-y-6">
        <div class="flex items-center gap-3">
          <USkeleton class="h-6 w-28 rounded-full" />
          <USkeleton class="h-6 w-24 rounded-full" />
        </div>

        <div class="space-y-3">
          <USkeleton class="h-10 w-full rounded-xl" />
          <USkeleton class="h-10 w-4/5 rounded-xl" />
        </div>

        <!-- Description skeleton -->
        <div class="space-y-2">
          <USkeleton class="h-4 w-full rounded" />
          <USkeleton class="h-4 w-full rounded" />
          <USkeleton class="h-4 w-5/6 rounded" />
        </div>

        <!-- Author & Stats skeleton -->
        <div class="flex flex-wrap items-center gap-6 pt-4 border-t border-smak-neutral-100 dark:border-smak-neutral-800">
          <div class="flex items-center gap-3">
            <USkeleton class="w-10 h-10 rounded-full" />
            <div class="space-y-1.5">
              <USkeleton class="h-3 w-16 rounded" />
              <USkeleton class="h-4 w-24 rounded" />
            </div>
          </div>
          <div class="space-y-1.5">
            <USkeleton class="h-3 w-16 rounded" />
            <USkeleton class="h-4 w-20 rounded" />
          </div>
        </div>
      </div>

      <!-- Cover Image Right Side -->
      <div class="lg:col-span-5">
        <USkeleton class="aspect-4/3 w-full rounded-3xl" />
      </div>
    </div>
  </div>
</template>
