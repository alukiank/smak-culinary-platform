<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  directions: string[]
}>()

const checkedDirections = ref<Record<number, boolean>>({})

const toggleDirection = (idx: number) => {
  checkedDirections.value[idx] = !checkedDirections.value[idx]
}
</script>

<template>
  <div class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100/50 dark:border-white/5 rounded-4xl p-6 sm:p-8 shadow-xs text-left">
    <h2 class="font-heading font-bold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white mb-6 flex items-center gap-2.5">
      <UIcon name="i-lucide-chef-hat" class="w-6 h-6 text-coral-500" />
      <span>Інструкція приготування</span>
    </h2>

    <div class="space-y-4">
      <div 
        v-for="(dir, idx) in directions" 
        :key="idx"
        @click="toggleDirection(idx)"
        class="relative flex items-start gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl transition-all duration-300 border border-smak-neutral-200/60 dark:border-white/5 bg-smak-neutral-50/80 dark:bg-smak-neutral-800/40 hover:border-coral-300 dark:hover:border-coral-500/40 cursor-pointer select-none group"
        :class="[
          checkedDirections[idx] 
            ? 'bg-coral-50/10 dark:bg-coral-950/10 border-coral-200/40 dark:border-coral-900/20 opacity-60' 
            : ''
        ]"
      >
        <!-- Connect Thread Line -->
        <div 
          v-if="idx < directions.length - 1" 
          class="absolute left-8.5 sm:left-10 top-12 sm:top-14 bottom-0 w-0.5 bg-smak-neutral-100/60 dark:bg-smak-neutral-800/60 -mb-10 z-0"
        ></div>

        <!-- Circle Button with Step Number -->
        <div 
          class="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0 flex items-center justify-center font-display font-black text-xs sm:text-sm transition-all duration-200 border-2 select-none"
          :class="[
            checkedDirections[idx] 
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
              : 'bg-white dark:bg-smak-neutral-800 border-coral-200 dark:border-coral-900/50 text-coral-500 group-hover:bg-coral-500 group-hover:border-coral-500 group-hover:text-white'
          ]"
        >
          <UIcon v-if="checkedDirections[idx]" name="i-lucide-check" class="w-4 h-4 text-white" />
          <span v-else>{{ idx + 1 }}</span>
        </div>

        <!-- Step Description Text -->
        <p 
          class="flex-1 text-sm sm:text-base leading-relaxed transition-all duration-200 text-left z-10 pt-1"
          :class="[checkedDirections[idx] ? 'line-through text-smak-neutral-400 dark:text-smak-neutral-500 font-medium' : 'text-smak-neutral-800 dark:text-smak-neutral-100 font-semibold']"
        >
          {{ dir }}
        </p>
      </div>
    </div>
  </div>
</template>
