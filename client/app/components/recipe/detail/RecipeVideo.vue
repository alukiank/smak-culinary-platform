<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  youtubeVideoUrl?: string
}>()

const embedVideoUrl = computed(() => {
  const url = props.youtubeVideoUrl
  if (!url) return ''
  let videoId = ''
  if (url.includes('v=')) {
    const parts = url.split('v=')
    if (parts[1]) {
      videoId = parts[1].split('&')[0] || ''
    }
  } else if (url.includes('youtu.be/')) {
    const parts = url.split('youtu.be/')
    if (parts[1]) {
      videoId = parts[1].split('?')[0] || ''
    }
  } else if (url.includes('embed/')) {
    const parts = url.split('embed/')
    if (parts[1]) {
      videoId = parts[1].split('?')[0] || ''
    }
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
})
</script>

<template>
  <div v-if="embedVideoUrl" class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100/50 dark:border-white/5 rounded-4xl p-6 shadow-xs text-left">
    <h3 class="font-heading font-bold text-lg sm:text-xl text-smak-neutral-900 dark:text-white mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-youtube" class="w-6 h-6 text-red-500" />
      <span>Відеорецепт приготування</span>
    </h3>
    <div class="relative aspect-video rounded-2xl overflow-hidden border border-smak-neutral-100/50 dark:border-white/5 bg-black">
      <iframe 
        :src="embedVideoUrl" 
        title="YouTube video player" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen
        class="absolute inset-0 w-full h-full"
      ></iframe>
    </div>
  </div>
</template>
