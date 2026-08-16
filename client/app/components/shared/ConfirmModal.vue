<script setup lang="ts">
import { ref, computed } from 'vue'

type ConfirmColor = 'primary' | 'error' | 'warning' | 'neutral' | 'coral' | 'rose'

interface Props {
  open?: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: ConfirmColor
  // Callbacks passed by useOverlay or manually
  onConfirm?: () => Promise<void> | void
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Підтвердити',
  cancelLabel: 'Скасувати',
  confirmColor: 'error'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open ?? true,
  set: (val) => {
    emit('update:open', val)
    if (!val) props.onClose?.()
  }
})

const buttonColor = computed(() => {
  if (props.confirmColor === 'rose') return 'error'
  return props.confirmColor || 'error'
})

const isLoading = ref(false)

const handleConfirm = async () => {
  if (props.onConfirm) {
    isLoading.value = true
    try {
      await props.onConfirm()
      isOpen.value = false
    } catch (e) {
      console.error('Confirmation action failed', e)
    } finally {
      isLoading.value = false
    }
  }
}

const handleCancel = () => {
  isOpen.value = false
  props.onClose?.()
}
</script>

<template>
  <UModal 
    v-model:open="isOpen"
    :ui="{
      overlay: 'z-[100]',
      content: 'z-[100] sm:max-w-sm rounded-3xl border border-smak-neutral-200 dark:border-smak-neutral-800 bg-white dark:bg-smak-neutral-900 shadow-2xl p-5 sm:p-6 overflow-hidden'
    }"
  >
    <template #content>
      <div class="space-y-4">
        <!-- Header area with title and close button -->
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-lg sm:text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
            {{ title }}
          </h3>
          <button
            type="button"
            class="p-1 rounded-full text-smak-neutral-400 hover:text-smak-neutral-700 dark:hover:text-smak-neutral-200 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            aria-label="Закрити"
            @click="handleCancel"
          >
            <UIcon name="i-lucide-x" class="w-4.5 h-4.5" />
          </button>
        </div>

        <p v-if="description" class="text-xs sm:text-sm text-smak-neutral-600 dark:text-smak-neutral-300 font-medium leading-relaxed">
          {{ description }}
        </p>

        <!-- Buttons area without dividing lines -->
        <div class="flex items-center justify-end gap-2.5 pt-2">
          <UButton 
            :label="cancelLabel" 
            color="neutral" 
            variant="ghost" 
            class="rounded-full px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer bg-transparent hover:bg-transparent border border-transparent hover:border-smak-neutral-300 dark:hover:border-smak-neutral-700"
            @click="handleCancel" 
          />
          <UButton 
            :label="confirmLabel" 
            :color="buttonColor" 
            variant="solid"
            class="rounded-full px-5 py-2 text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all hover:scale-105"
            :class="confirmColor === 'error' || confirmColor === 'rose'
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
              : 'shadow-primary-500/25'"
            :loading="isLoading"
            @click="handleConfirm" 
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

