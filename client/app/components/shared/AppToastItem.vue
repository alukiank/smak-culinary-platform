<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  toast: any
}>()

const { remove } = useToast()

const duration = computed(() => {
  if (props.toast.duration === 0 || props.toast.duration === Infinity || props.toast.duration === -1) {
    return 0
  }
  return typeof props.toast.duration === 'number' ? props.toast.duration : 4500
})

const showProgress = computed(() => {
  if (props.toast.progress === false) return false
  return duration.value > 0
})

let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (duration.value > 0) {
    timer = setTimeout(() => {
      remove(props.toast.id)
    }, duration.value)
  }
})

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
})

const colorConfig = computed(() => {
  const color = props.toast.color || 'primary'
  switch (color) {
    case 'success':
      return {
        defaultIcon: 'i-lucide-check-circle-2',
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        progressBar: 'bg-emerald-500 dark:bg-emerald-400',
        border: 'border-emerald-500/20 dark:border-emerald-500/30'
      }
    case 'error':
    case 'danger':
      return {
        defaultIcon: 'i-lucide-alert-circle',
        iconColor: 'text-rose-500 dark:text-rose-400',
        iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
        progressBar: 'bg-rose-500 dark:bg-rose-400',
        border: 'border-rose-500/20 dark:border-rose-500/30'
      }
    case 'warning':
      return {
        defaultIcon: 'i-lucide-alert-triangle',
        iconColor: 'text-amber-500 dark:text-amber-400',
        iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
        progressBar: 'bg-amber-500 dark:bg-amber-400',
        border: 'border-amber-500/20 dark:border-amber-500/30'
      }
    case 'coral':
    case 'primary':
      return {
        defaultIcon: 'i-lucide-sparkles',
        iconColor: 'text-coral-500 dark:text-coral-400',
        iconBg: 'bg-coral-500/10 dark:bg-coral-500/20',
        progressBar: 'bg-coral-500 dark:bg-coral-400',
        border: 'border-coral-500/20 dark:border-coral-500/30'
      }
    case 'orange':
      return {
        defaultIcon: 'i-lucide-info',
        iconColor: 'text-orange-500 dark:text-orange-400',
        iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
        progressBar: 'bg-orange-500 dark:bg-orange-400',
        border: 'border-orange-500/20 dark:border-orange-500/30'
      }
    case 'ai-indigo':
      return {
        defaultIcon: 'i-lucide-sparkles',
        iconColor: 'text-ai-indigo-500 dark:text-ai-indigo-400',
        iconBg: 'bg-ai-indigo-500/10 dark:bg-ai-indigo-500/20',
        progressBar: 'bg-ai-indigo-500 dark:bg-ai-indigo-400',
        border: 'border-ai-indigo-500/20 dark:border-ai-indigo-500/30'
      }
    case 'neutral':
    case 'smak-neutral':
    default:
      return {
        defaultIcon: 'i-lucide-info',
        iconColor: 'text-smak-neutral-500 dark:text-smak-neutral-400',
        iconBg: 'bg-smak-neutral-500/10 dark:bg-smak-neutral-500/20',
        progressBar: 'bg-smak-neutral-500 dark:bg-smak-neutral-400',
        border: 'border-smak-neutral-200/80 dark:border-smak-neutral-800'
      }
  }
})

const iconName = computed(() => props.toast.icon || colorConfig.value.defaultIcon)

function handleClose() {
  remove(props.toast.id)
}

function handleClick() {
  if (props.toast.onClick) {
    props.toast.onClick(props.toast)
  }
}

function handleAction(action: any) {
  if (action.onClick) {
    action.onClick()
  }
}
</script>

<template>
  <div
    role="alert"
    aria-live="polite"
    class="pointer-events-auto relative group overflow-hidden w-full rounded-2xl bg-white/95 dark:bg-smak-neutral-900/95 backdrop-blur-md border shadow-xl shadow-black/5 dark:shadow-black/40 p-4 transition-all duration-200 ease-out"
    :class="[
      colorConfig.border,
      toast.onClick ? 'cursor-pointer' : ''
    ]"
    @click="handleClick"
  >
    <div class="flex items-start gap-3.5">
      <!-- Icon / Avatar -->
      <div class="shrink-0 mt-0.5">
        <UAvatar
          v-if="toast.avatar"
          v-bind="toast.avatar"
          size="sm"
          class="shrink-0"
        />
        <div
          v-else
          class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          :class="colorConfig.iconBg"
        >
          <UIcon
            :name="iconName"
            class="w-4.5 h-4.5"
            :class="colorConfig.iconColor"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0 pr-6">
        <h4
          v-if="toast.title"
          class="text-sm font-semibold text-smak-neutral-900 dark:text-white leading-snug"
        >
          {{ toast.title }}
        </h4>
        <p
          v-if="toast.description"
          class="text-xs sm:text-sm text-smak-neutral-600 dark:text-smak-neutral-300 leading-relaxed"
          :class="toast.title ? 'mt-1' : ''"
        >
          {{ toast.description }}
        </p>

        <!-- Action buttons -->
        <div
          v-if="toast.actions && toast.actions.length > 0"
          class="mt-3 flex flex-wrap gap-2 items-center"
        >
          <UButton
            v-for="(action, idx) in toast.actions"
            :key="idx"
            size="xs"
            :color="action.color || toast.color || 'primary'"
            :variant="action.variant || 'solid'"
            v-bind="action"
            @click.stop="handleAction(action)"
          >
            {{ action.label }}
          </UButton>
        </div>
      </div>

      <!-- Close Button -->
      <button
        v-if="toast.close !== false"
        type="button"
        aria-label="Закрити"
        class="absolute top-3.5 right-3.5 p-1 rounded-lg text-smak-neutral-400 hover:text-smak-neutral-700 dark:hover:text-white hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-coral-500/40"
        @click.stop="handleClose"
      >
        <UIcon
          :name="toast.closeIcon || 'i-lucide-x'"
          class="w-4 h-4 block"
        />
      </button>
    </div>

    <!-- Continuous Linear Progress Bar (No Pause on Hover/Blur) -->
    <div
      v-if="showProgress"
      class="absolute inset-x-0 bottom-0 h-1 bg-smak-neutral-100 dark:bg-smak-neutral-800/80 overflow-hidden"
    >
      <div
        class="h-full w-full origin-left will-change-transform"
        :class="colorConfig.progressBar"
        :style="{
          animation: `toast-progress-shrink ${duration}ms linear forwards`
        }"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes toast-progress-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
