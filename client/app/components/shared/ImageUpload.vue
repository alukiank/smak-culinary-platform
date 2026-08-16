<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStagedUpload } from '~/composables/useStagedUpload'

const props = withDefaults(
  defineProps<{
    label?: string
    description?: string
    aspect?: 'video' | 'square' | 'wide' | 'auto' | string
    maxSize?: number // default 5MB
  }>(),
  {
    label: 'Завантаження зображення',
    description: 'Перетягніть файл сюди або натисніть для вибору. Формати: WEBP, PNG, JPG (макс. 5MB)',
    aspect: 'video',
    maxSize: 5 * 1024 * 1024
  }
)

// The final publicId (for already existing images or after upload)
const modelValue = defineModel<string | null | undefined>({ default: null })

const { 
  stagedFiles, 
  isUploading, 
  uploadProgress, 
  addFiles, 
  removeFile, 
  executeUpload 
} = useStagedUpload()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const localError = ref<string | null>(null)

const currentFile = computed(() => stagedFiles.value[0] || null)

// Synchronize with parent model (e.g. when modal opens/closes or form resets)
watch(() => modelValue.value, (newVal) => {
  // Only update stagedFiles if they are empty or if newVal is null (reset)
  if (newVal === null) {
    stagedFiles.value = []
  } else if (newVal && stagedFiles.value.length === 0) {
    stagedFiles.value = [{ id: newVal, preview: newVal }]
  }
}, { immediate: true })

const triggerSelect = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

const validateAndAdd = (file: File) => {
  localError.value = null

  // Validate type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    localError.value = 'Непідтримуваний формат файлу. Використовуйте WEBP, PNG або JPG.'
    return
  }

  // Validate size
  if (file.size > props.maxSize) {
    const sizeInMb = (props.maxSize / (1024 * 1024)).toFixed(0)
    localError.value = `Файл занадто великий. Максимальний розмір — ${sizeInMb}MB.`
    return
  }

  // Replace existing or add new
  stagedFiles.value = [] 
  addFiles([file])
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    validateAndAdd(target.files[0])
  }
  target.value = ''
}

// Drag & Drop
const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (!isUploading.value) isDragging.value = true
}

const onDragLeave = () => { isDragging.value = false }

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  if (isUploading.value) return
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    validateAndAdd(e.dataTransfer.files[0])
  }
}

const handleRemove = () => {
  removeFile(0)
  modelValue.value = null
}

/**
 * Public method to be called by parents (e.g. Profile settings, Review form).
 */
const uploadAndGetId = async (): Promise<string | null> => {
  console.log('[ImageUpload] uploadAndGetId called. Staged files count:', stagedFiles.value.length)
  const ids = await executeUpload()
  const finalId = ids[0] || null
  console.log('[ImageUpload] Final ID:', finalId)
  modelValue.value = finalId
  return finalId
}

defineExpose({ uploadAndGetId })
</script>

<template>
  <div class="flex flex-col gap-2 w-full text-left">
    <label v-if="label" class="block text-sm font-bold text-smak-neutral-700 dark:text-smak-neutral-300">
      {{ label }}
    </label>

    <div
      class="relative group rounded-[1.25rem] overflow-hidden border border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer select-none bg-smak-neutral-50/50 dark:bg-smak-neutral-900/30"
      :class="[
        aspect === 'video' ? 'aspect-video' : aspect === 'square' ? 'aspect-square' : 'min-h-[220px]',
        isDragging 
          ? 'border-coral-500 bg-coral-50/30 dark:bg-coral-950/10 scale-[0.99] ring-2 ring-coral-400/20' 
          : 'border-smak-neutral-200 dark:border-smak-neutral-800 hover:border-coral-400 dark:hover:border-coral-800 hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-900/50'
      ]"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="triggerSelect"
    >
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/jpg" class="hidden" @change="onFileChange" />

      <!-- State: Preview -->
      <template v-if="currentFile && !isUploading">
        <img v-if="currentFile.preview.startsWith('blob:')" :src="currentFile.preview" class="w-full h-full object-cover" />
        <SharedCloudImage v-else :public-id="currentFile.preview" :aspect="aspect" class="w-full h-full" />
        
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3.5 z-20 backdrop-blur-xs" @click.stop>
          <button type="button" class="w-11 h-11 rounded-full bg-white hover:bg-smak-neutral-100 text-smak-neutral-800 hover:text-coral-500 shadow-lg transition-all flex items-center justify-center cursor-pointer border-0" title="Змінити фото" @click="triggerSelect">
            <UIcon name="i-lucide-refresh-cw" class="w-5 h-5" />
          </button>
          <button type="button" class="w-11 h-11 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition-all flex items-center justify-center cursor-pointer border-0" title="Видалити фото" @click="handleRemove">
            <UIcon name="i-lucide-trash-2" class="w-5 h-5" />
          </button>
        </div>
      </template>

      <!-- State: Uploading -->
      <div v-else-if="isUploading" class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 z-20 bg-white/85 dark:bg-smak-neutral-900/85 backdrop-blur-md">
        <div class="relative w-16 h-16 flex items-center justify-center">
          <svg class="w-full h-full rotate-270 transform">
            <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="transparent" class="text-smak-neutral-100 dark:text-smak-neutral-800" />
            <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="transparent" stroke-dasharray="175.9" :stroke-dashoffset="175.9 - (175.9 * uploadProgress) / 100" class="text-coral-500 dark:text-coral-400 transition-all duration-300" stroke-linecap="round" />
          </svg>
          <span class="absolute text-xs font-extrabold">{{ uploadProgress }}%</span>
        </div>
        <p class="text-sm font-bold">Збереження...</p>
      </div>

      <!-- State: Empty -->
      <div v-else class="p-6 text-center flex flex-col items-center gap-3.5 z-10">
        <div class="w-12 h-12 rounded-2xl bg-coral-50 dark:bg-coral-950/20 text-coral-500 flex items-center justify-center shadow-xs">
          <UIcon name="i-lucide-upload-cloud" class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-bold group-hover:text-coral-500 transition-colors">Завантажити фото</p>
          <p class="text-xs text-smak-neutral-400 mt-1.5">{{ description }}</p>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="localError" class="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-medium shadow-xs">
      <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0 mt-0.5" />
      <span>{{ localError }}</span>
    </div>
  </div>
</template>

<style scoped>
.backdrop-blur-xs { backdrop-filter: blur(2px); }
.backdrop-blur-md { backdrop-filter: blur(12px); }
</style>
