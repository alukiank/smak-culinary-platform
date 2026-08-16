<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAdminModeration } from '~/composables/useAdminModeration'
import type { ModerationDecision } from '~/types/moderation'

import { useCloudinary } from '~/composables/useCloudinary'
import { categoryTranslations } from '~/utils/formatters'

const props = defineProps<{
  id: string
  type: 'recipe' | 'review'
  title?: string
  initialDecision?: ModerationDecision
  itemData?: any
}>()

const emit = defineEmits<{
  (e: 'success', result: any): void
  (e: 'close'): void
}>()

const open = defineModel<boolean>('open', { default: false })

const { moderateRecipe, moderateReview, loading, error: apiError } = useAdminModeration()
const { getUrl } = useCloudinary()

const decision = ref<ModerationDecision>(props.initialDecision || 'approved')
const reason = ref('')
const validationError = ref<string | null>(null)

// Reset state on open
watch(open, (isOpen) => {
  if (isOpen) {
    decision.value = props.initialDecision || 'approved'
    reason.value = ''
    validationError.value = null
  }
})

const handleDecisionSelect = (val: ModerationDecision) => {
  decision.value = val
  validationError.value = null
}

const submitModeration = async () => {
  validationError.value = null
  
  if (decision.value === 'rejected' && !reason.value.trim()) {
    validationError.value = 'Будь ласка, вкажіть причину відхилення'
    return
  }

  try {
    let result
    if (props.type === 'recipe') {
      result = await moderateRecipe(props.id, decision.value, reason.value.trim() || undefined)
    } else {
      result = await moderateReview(props.id, decision.value, reason.value.trim() || undefined)
    }
    
    emit('success', result)
    open.value = false
  } catch (err: any) {
    console.error('Failed to submit moderation decision', err)
  }
}
</script>

<template>
  <UModal 
    v-model:open="open" 
    :ui="{ content: 'sm:max-w-lg rounded-3xl' }"
  >
    <template #content>
      <div class="p-6 sm:p-8 space-y-6 text-left">
        <!-- Modal Header -->
        <div class="flex justify-between items-start gap-4">
          <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
            {{ title || 'Модерація об\'єкта' }}
          </h3>
          <UButton 
            icon="i-lucide-x" 
            color="neutral" 
            variant="ghost" 
            class="rounded-full h-8 w-8 p-0 cursor-pointer" 
            @click="open = false" 
          />
        </div>

        <!-- Modal Body Content -->
        <div class="space-y-6">
          <!-- Review Preview (if type is review and itemData is provided) -->
          <div 
            v-if="type === 'review' && itemData" 
            class="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl space-y-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-900 dark:text-white">
                    {{ itemData.user?.displayname || 'Без імені' }}
                  </span>
                  <span class="text-xs text-gray-500 font-mono">
                    @{{ itemData.user?.username }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">
                  Рецепт: <span class="font-semibold text-gray-600 dark:text-gray-300">{{ itemData.recipe?.title || 'Невідомий рецепт' }}</span>
                </p>
              </div>
              
              <!-- Rating stars -->
              <div class="flex items-center gap-0.5 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
                <UIcon name="i-lucide-star" class="w-3.5 h-3.5 fill-current" />
                <span>{{ itemData.rating }}</span>
              </div>
            </div>

            <!-- Review text -->
            <div class="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap wrap-break-word leading-relaxed">
              {{ itemData.text }}
            </div>

            <!-- Review image -->
            <div v-if="itemData.imageId" class="relative group overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 max-h-60 bg-gray-100 dark:bg-gray-950 flex justify-center items-center">
              <img 
                :src="getUrl(itemData.imageId, { width: 500, height: 350, crop: 'fit' })" 
                alt="Зображення відгуку" 
                class="max-w-full max-h-60 object-contain rounded-xl"
              />
            </div>
          </div>

          <!-- Recipe Preview (if type is recipe and itemData is provided) -->
          <div 
            v-if="type === 'recipe' && itemData" 
            class="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex gap-4"
          >
            <div v-if="itemData.coverImageId" class="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-900">
              <img 
                :src="getUrl(itemData.coverImageId, { width: 100, height: 100, crop: 'fill' })" 
                alt="Обкладинка" 
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-gray-900 dark:text-white truncate">
                {{ itemData.title }}
              </h4>
              <p class="text-xs text-gray-500 font-mono mt-0.5">
                Автор: @{{ itemData.user?.username }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                Категорія: {{ categoryTranslations[itemData.category] || itemData.category }}
              </p>
            </div>
          </div>

          <!-- Main Decision Cards -->
          <div>
            <label class="block text-sm font-bold font-heading text-smak-neutral-800 dark:text-smak-neutral-200 mb-3">
              Оберіть рішення модерації:
            </label>
            <div class="grid grid-cols-2 gap-3">
              <!-- Approved -->
              <button 
                type="button"
                class="flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-smooth cursor-pointer"
                :class="[
                  decision === 'approved' 
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm' 
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'
                ]"
                @click="handleDecisionSelect('approved')"
              >
                <UIcon name="i-lucide-check-circle" class="w-7 h-7 mb-2" />
                <span class="text-xs font-bold font-heading">Схвалити</span>
              </button>

              <!-- Rejected -->
              <button 
                type="button"
                class="flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-smooth cursor-pointer"
                :class="[
                  decision === 'rejected' 
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold shadow-sm' 
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'
                ]"
                @click="handleDecisionSelect('rejected')"
              >
                <UIcon name="i-lucide-x-circle" class="w-7 h-7 mb-2" />
                <span class="text-xs font-bold font-heading">Відхилити</span>
              </button>
            </div>
          </div>

          <!-- Reason Textarea -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-bold font-heading text-smak-neutral-800 dark:text-smak-neutral-200">
                Коментар / Причина рішення:
              </label>
              <span 
                v-if="decision === 'rejected'" 
                class="text-xs text-rose-500 dark:text-rose-400 font-bold"
              >
                Обов'язково
              </span>
              <span v-else class="text-xs text-gray-400 dark:text-gray-500 font-normal">
                Необов'язково
              </span>
            </div>
            
            <UTextarea 
              v-model="reason" 
              placeholder="Введіть опис причин прийнятого рішення..." 
              :rows="4" 
              class="w-full"
              :color="decision === 'rejected' ? 'error' : 'neutral'"
            />

            <p v-if="validationError" class="text-xs font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
              <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5" />
              {{ validationError }}
            </p>
          </div>

          <!-- Error Alerts -->
          <UAlert 
            v-if="apiError" 
            color="error" 
            icon="i-lucide-alert-triangle" 
            :title="apiError" 
          />
        </div>

        <!-- Footer actions -->
        <div class="flex justify-end gap-3 w-full pt-2">
          <UButton 
            label="Скасувати" 
            color="neutral" 
            variant="ghost" 
            class="flex-1 sm:flex-initial justify-center rounded-xl py-2.5 font-bold cursor-pointer"
            @click="open = false" 
          />
          <UButton 
            label="Підтвердити" 
            color="primary" 
            variant="solid"
            class="flex-1 sm:flex-initial justify-center rounded-xl py-2.5 font-bold cursor-pointer shadow-lg shadow-coral-500/10"
            :loading="loading"
            @click="submitModeration" 
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
