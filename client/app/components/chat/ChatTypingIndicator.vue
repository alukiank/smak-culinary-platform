<script setup lang="ts">
// No props needed — purely visual
</script>

<template>
  <div class="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-smak-neutral-800 border border-smak-neutral-100 dark:border-smak-neutral-700 shadow-sm w-fit max-w-[200px]">
    <!-- Bouncing dots -->
    <div class="flex items-center gap-1">
      <span class="w-2 h-2 rounded-full bg-ai-indigo-400 dark:bg-ai-indigo-500 animate-bounce" style="animation-delay: 0ms" />
      <span class="w-2 h-2 rounded-full bg-ai-indigo-400 dark:bg-ai-indigo-500 animate-bounce" style="animation-delay: 150ms" />
      <span class="w-2 h-2 rounded-full bg-ai-indigo-400 dark:bg-ai-indigo-500 animate-bounce" style="animation-delay: 300ms" />
    </div>
    <span class="text-xs text-smak-neutral-400 dark:text-smak-neutral-500 font-medium">Думає...</span>
  </div>
</template>
