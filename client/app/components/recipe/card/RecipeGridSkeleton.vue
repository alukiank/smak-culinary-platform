<script setup lang="ts">
interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 6
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <div 
      v-for="n in count" 
      :key="n" 
      class="flex flex-col bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-2xl overflow-hidden shadow-xs h-full animate-pulse"
    >
      <!-- Image Aspect Skeleton -->
      <USkeleton class="aspect-video w-full" />
      
      <!-- Details skeleton content -->
      <div class="p-5 flex-1 flex flex-col gap-4">
        <div class="space-y-2 flex-1">
          <USkeleton class="h-4 w-1/4 rounded bg-coral-100 dark:bg-coral-950/20" />
          <USkeleton class="h-6 w-3/4 rounded" />
          <USkeleton class="h-4 w-full rounded" />
          <USkeleton class="h-4 w-5/6 rounded" />
        </div>
        
        <div class="h-px bg-smak-neutral-100 dark:bg-smak-neutral-800 w-full my-1"></div>
        
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <USkeleton class="w-6 h-6 rounded-full" />
            <USkeleton class="h-4 w-20 rounded" />
          </div>
          <USkeleton class="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
</template>
