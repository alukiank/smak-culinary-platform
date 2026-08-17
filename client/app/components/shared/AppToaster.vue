<script setup lang="ts">
import { computed } from 'vue'
import AppToastItem from './AppToastItem.vue'

const { toasts } = useToast()

// Filter open toasts only
const activeToasts = computed(() => {
  return toasts.value.filter((t: any) => t.open !== false)
})
</script>

<template>
  <Teleport to="body">
    <div
      aria-live="polite"
      class="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      <TransitionGroup
        name="toast-slide"
        tag="div"
        class="flex flex-col-reverse gap-2.5 w-full pointer-events-none"
      >
        <AppToastItem
          v-for="toast in activeToasts"
          :key="toast.id"
          :toast="toast"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.toast-slide-move {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
