<script setup lang="ts">
</script>

<template>
  <div class="space-y-8 animate-pulse pt-6 sm:pt-10 text-left">
    <!-- Header Summary -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div class="flex items-center gap-6">
        <div class="space-y-1 text-center">
          <USkeleton class="h-10 w-16 rounded mx-auto" />
          <USkeleton class="h-3 w-20 rounded" />
        </div>
        <div class="space-y-2 flex-1 min-w-[200px]">
          <USkeleton v-for="i in 5" :key="i" class="h-2 w-full rounded-full" />
        </div>
      </div>
      <USkeleton class="h-12 w-48 rounded-2xl" />
    </div>

    <!-- Review cards list -->
    <div class="space-y-4">
      <div 
        v-for="i in 3" 
        :key="i"
        class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-3xl p-6 space-y-4 shadow-xs"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <USkeleton class="w-10 h-10 rounded-full" />
            <div class="space-y-1">
              <USkeleton class="h-4 w-28 rounded" />
              <USkeleton class="h-3 w-20 rounded" />
            </div>
          </div>
          <USkeleton class="h-6 w-20 rounded-lg" />
        </div>
        <div class="space-y-2 pt-2">
          <USkeleton class="h-4 w-full rounded" />
          <USkeleton class="h-4 w-5/6 rounded" />
        </div>
      </div>
    </div>
  </div>
</template>
