<script setup lang="ts">
import type { RecipeCollectionResponseDto } from '~/types/collection'

const props = defineProps<{
  collection?: RecipeCollectionResponseDto
  title: string
}>()

const emit = defineEmits(['close', 'success'])

const { createCollection, updateCollection } = useCollections()
const isLoading = ref(false)

const form = ref({
  name: props.collection?.name || '',
  description: props.collection?.description || ''
})

const handleSubmit = async () => {
  if (!form.value.name.trim()) return
  
  isLoading.value = true
  try {
    if (props.collection) {
      await updateCollection(props.collection.id, form.value)
    } else {
      await createCollection(form.value)
    }
    emit('success')
    emit('close')
  } catch (e) {
    // Error handled in composable
  } finally {
    isLoading.value = false
  }
}

const preventMobileAutoFocus = (e: Event) => {
  if (import.meta.client && 'ontouchstart' in globalThis) e.preventDefault()
}
</script>

<template>
  <UModal :title="title" :ui="{ content: 'sm:max-w-md rounded-3xl' }" :content="{ onOpenAutoFocus: preventMobileAutoFocus }">
    <template #content>
      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-2">
          <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white">
            {{ title }}
          </h3>
          <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 font-medium">
            Заповніть дані вашої підбірки рецептів
          </p>
        </div>

        <div class="space-y-4">
          <UFormField label="Назва" required>
            <UInput 
              v-model="form.name" 
              placeholder="Наприклад: Сніданки" 
              class="w-full"
              size="lg"
            />
          </UFormField>

          <UFormField label="Опис (необов'язково)">
            <UTextarea 
              v-model="form.description" 
              placeholder="Короткий опис вашої підбірки..." 
              class="w-full"
              size="lg"
              :rows="3"
            />
          </UFormField>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <UButton 
            label="Скасувати" 
            color="neutral" 
            variant="ghost" 
            class="flex-1 justify-center rounded-xl py-3 font-bold"
            @click="$emit('close')" 
          />
          <UButton 
            :label="collection ? 'Оновити' : 'Створити'" 
            color="primary" 
            class="flex-1 justify-center rounded-xl py-3 font-bold shadow-lg shadow-primary-500/20"
            :loading="isLoading"
            :disabled="!form.name.trim()"
            @click="handleSubmit" 
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
