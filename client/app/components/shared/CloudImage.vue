<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCloudinary } from '~/composables/useCloudinary'

const props = withDefaults(
  defineProps<{
    publicId: string | null | undefined
    alt?: string
    width?: number
    height?: number
    crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'pad' | 'crop'
    gravity?: 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
    radius?: number | 'max'
    aspect?: 'video' | 'square' | 'wide' | 'auto' | string
    fallback?: string
  }>(),
  {
    alt: 'Рецепт',
    crop: 'fill',
    gravity: 'center',
    aspect: 'auto'
  }
)

const { getUrl, getPlaceholderUrl } = useCloudinary()

const isLoaded = ref(false)
const hasError = ref(false)

// Watch for publicId changes to reset states
watch(
  () => props.publicId,
  () => {
    isLoaded.value = false
    hasError.value = false
  }
)

// Generate premium optimized high-res Cloudinary URL
const highResUrl = computed(() => {
  if (!props.publicId) return ''
  if (props.publicId.startsWith('http')) return props.publicId
  return getUrl(props.publicId, {
    width: props.width,
    height: props.height,
    crop: props.crop,
    gravity: props.gravity,
    radius: props.radius
  })
})

// Generate low-quality blur-up placeholder URL
const placeholderUrl = computed(() => {
  if (!props.publicId) return ''
  if (props.publicId.startsWith('http')) return ''
  return getPlaceholderUrl(props.publicId)
})

const handleLoad = () => {
  isLoaded.value = true
}

const handleError = () => {
  hasError.value = true
}

// Map common ratio strings to Tailwind ratio classes
const aspectClass = computed(() => {
  const mapping: Record<string, string> = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
    auto: 'h-full w-full'
  }
  return mapping[props.aspect] || props.aspect
})
</script>

<template>
  <div 
    class="relative overflow-hidden bg-smak-neutral-100 dark:bg-smak-neutral-800/60" 
    :class="aspectClass"
  >
    <!-- Fallback or Error Display (Gentle coral background with a food icon) -->
    <div
      v-if="!publicId || hasError"
      class="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-coral-50/80 to-coral-100/40 dark:from-coral-950/15 dark:to-coral-900/5 p-4 select-none"
    >
      <!-- Custom image fallback if explicitly passed as prop -->
      <img
        v-if="fallback"
        :src="fallback"
        :alt="alt"
        class="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />
      
      <!-- Premium branded gentle coral fallback with food icon -->
      <template v-else>
        <div class="relative flex items-center justify-center p-4 rounded-2xl bg-white/80 dark:bg-smak-neutral-900/60 backdrop-blur-md shadow-xs border border-coral-200/20 dark:border-coral-800/15 transition-all duration-500 group-hover:scale-105">
          <UIcon 
            name="i-lucide-cooking-pot" 
            class="w-8 h-8 text-coral-500/80 dark:text-coral-400" 
          />
        </div>
        <p class="text-[10px] font-black uppercase tracking-wider text-coral-500/70 dark:text-coral-400/60 mt-3 text-center line-clamp-1 max-w-[85%]">
          {{ alt }}
        </p>
      </template>
    </div>

    <!-- Blurred Low-Quality Placeholder (LQIP) -->
    <div
      v-else-if="placeholderUrl && !isLoaded"
      class="absolute inset-0 z-10 filter blur-xl scale-110 pointer-events-none transition-opacity duration-500 ease-out"
      :class="{ 'opacity-100': !isLoaded, 'opacity-0': isLoaded }"
    >
      <img
        :src="placeholderUrl"
        alt="Завантаження..."
        class="w-full h-full object-cover"
      />
    </div>

    <!-- High-Resolution Premium Optimized Image -->
    <img
      v-if="publicId && !hasError"
      :src="highResUrl"
      :alt="alt"
      @load="handleLoad"
      @error="handleError"
      class="w-full h-full object-cover transition-all duration-700 ease-in-out"
      :class="[
        isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-102 blur-sm'
      ]"
      loading="lazy"
    />
  </div>
</template>
