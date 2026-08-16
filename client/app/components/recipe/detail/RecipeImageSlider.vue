<script setup lang="ts">
import { ref } from 'vue'
import { useStagedUpload } from '~/composables/useStagedUpload'

const props = defineProps<{
  initialCoverId?: string | null
  initialGalleryIds?: string[]
}>()

const { 
  stagedFiles, 
  isUploading, 
  uploadProgress, 
  addFiles, 
  removeFile, 
  moveFile, 
  executeUpload 
} = useStagedUpload()

const fileInput = ref<HTMLInputElement | null>(null)
const currentIndex = ref(0)
const coverIndex = ref(0) // Internal pointer to which staged file is the cover

// Initialize existing images
if (props.initialCoverId) {
  stagedFiles.value.push({ id: props.initialCoverId, preview: props.initialCoverId })
}
if (props.initialGalleryIds) {
  props.initialGalleryIds.forEach(id => {
    stagedFiles.value.push({ id, preview: id })
  })
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    addFiles(Array.from(target.files))
  }
  target.value = ''
}

const handleRemove = (index: number) => {
  removeFile(index)
  if (coverIndex.value === index) {
    coverIndex.value = 0
  } else if (coverIndex.value > index) {
    coverIndex.value--
  }
  
  if (currentIndex.value >= stagedFiles.value.length) {
    currentIndex.value = Math.max(0, stagedFiles.value.length - 1)
  }
}

const setAsCover = (index: number) => {
  if (!stagedFiles.value[index]) return
  
  // Move to front for UX (optional, but consistent with previous logic)
  moveFile(index, 0)
  coverIndex.value = 0
  currentIndex.value = 0
}

const nextSlide = () => {
  if (stagedFiles.value.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % stagedFiles.value.length
  }
}

const prevSlide = () => {
  if (stagedFiles.value.length > 0) {
    currentIndex.value = (currentIndex.value - 1 + stagedFiles.value.length) % stagedFiles.value.length
  }
}

/**
 * Public method called by create.vue.
 * Returns IDs for both cover and gallery.
 */
const uploadAndGetIds = async () => {
  const allIds = await executeUpload()
  // First ID is cover (because we move cover to 0)
  const coverId = allIds.length > 0 ? allIds[0] : null
  const galleryIds = allIds.length > 1 ? allIds.slice(1) : []
  
  return { coverId, galleryIds }
}

defineExpose({ uploadAndGetIds })
</script>

<template>
  <div class="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] group overflow-hidden rounded-3xl bg-smak-neutral-100 dark:bg-smak-neutral-800 shadow-2xl transition-all duration-500 border border-smak-neutral-200 dark:border-smak-neutral-700">
    <!-- Empty State -->
    <div v-if="stagedFiles.length === 0" class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-brand-gradient/10">
      <div class="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-coral-500 shadow-inner animate-pulse">
        <UIcon name="i-lucide-camera" class="w-10 h-10" />
      </div>
      <div class="text-center">
        <h3 class="font-heading font-black text-xl text-smak-neutral-800 dark:text-white">Додайте фотографії</h3>
        <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 mt-1">Перше фото стане головним</p>
      </div>
      <UButton
        size="xl"
        class="mt-4 font-black px-8 rounded-2xl shadow-lg hover:shadow-coral-500/30 transition-all duration-300"
        @click="triggerUpload"
      >
        <UIcon name="i-lucide-plus" class="w-5 h-5 mr-2" />
        Вибрати файли
      </UButton>
    </div>

    <!-- Slider Content -->
    <template v-else>
      <div class="absolute inset-0 transition-transform duration-700 ease-in-out flex" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
        <div v-for="(img, idx) in stagedFiles" :key="idx" class="relative min-w-full h-full">
          <img v-if="img.preview.startsWith('blob:')" :src="img.preview" class="w-full h-full object-cover" />
          <SharedCloudImage v-else :public-id="img.preview" aspect="auto" class="w-full h-full object-cover" />
          
          <!-- Badge -->
          <div class="absolute top-6 left-6 z-20 flex gap-2">
            <span v-if="idx === coverIndex" class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-coral-500 text-white text-xs font-black uppercase tracking-wider shadow-lg">
              <UIcon name="i-lucide-star" class="w-3.5 h-3.5" />
              Обкладинка
            </span>
            <span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-bold shadow-lg">
              {{ idx + 1 }} / {{ stagedFiles.length }}
            </span>
          </div>

          <!-- Overlay -->
          <div class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>

      <!-- Navigation Arrows -->
      <div v-if="stagedFiles.length > 1" class="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <button @click="prevSlide" class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white/20 pointer-events-auto transition-all shadow-xl active:scale-95">
          <UIcon name="i-lucide-chevron-left" class="w-6 h-6" />
        </button>
        <button @click="nextSlide" class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white/20 pointer-events-auto transition-all shadow-xl active:scale-95">
          <UIcon name="i-lucide-chevron-right" class="w-6 h-6" />
        </button>
      </div>

      <!-- Toolbar -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
        <button @click="triggerUpload" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all">
          <UIcon name="i-lucide-plus" class="w-4 h-4" />
          <span>Додати</span>
        </button>
        <div class="w-px h-6 bg-white/10 mx-1"></div>
        <button v-if="currentIndex !== coverIndex" @click="setAsCover(currentIndex)" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-coral-500 text-white text-sm font-bold transition-all">
          <UIcon name="i-lucide-star" class="w-4 h-4" />
          <span>Головна</span>
        </button>
        <button @click="handleRemove(currentIndex)" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-white text-sm font-bold transition-all">
          <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
          <span>Видалити</span>
        </button>
      </div>
      
      <!-- Upload Progress -->
      <div v-if="isUploading" class="absolute bottom-0 left-0 right-0 z-40">
        <div class="h-1.5 bg-white/10 backdrop-blur-sm overflow-hidden">
          <div class="h-full bg-coral-500 transition-all duration-300" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
      </div>
    </template>

    <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="handleFileUpload" />
  </div>
</template>

<style scoped>
.backdrop-blur-md { backdrop-filter: blur(12px); }
.backdrop-blur-xl { backdrop-filter: blur(24px); }
.backdrop-blur-2xl { backdrop-filter: blur(40px); }
</style>
