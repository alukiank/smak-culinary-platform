<!--
@page-docs
title: My Collections
description: Page for managing the user's custom recipe collections. Allows grouping favorited recipes. Free tier allows up to 1 collection, while premium plans unlock more.
features:
  - Create collection: modal form to create a new collection with name and description (billing tier checks apply).
  - Edit collection: rename and update the description of an existing collection.
  - Delete collection: delete custom collections with confirmation modal (does not delete recipes, only the collection folder).
  - View collections: list of collections linking to detailed collection pages (/profile/collections/:id).
-->

<script setup lang="ts">
import { computed } from 'vue'
import type { RecipeCollectionResponseDto } from '~/types/collection'
import { SharedCollectionFormModal, SharedConfirmModal } from '#components'
import { useBilling } from '~/composables/useBilling'

definePageMeta({
  middleware: 'auth',
  layout: 'profile'
})

useSeoMeta({
  title: 'Smak | Мої колекції',
  description: 'Ваші персональні підбірки рецептів.'
})

const { getCollections, deleteCollection } = useCollections()
const { activePlan, currentPlanConfig, triggerUpgradeModal, fetchSubscription } = useBilling()
const overlay = useOverlay()

const isFreePlan = computed(() => activePlan.value === 'FREE')

const { data: collections, refresh, pending } = await useAsyncData(
  'user-collections',
  () => getCollections()
)

const openCreateModal = async () => {
  if (collections.value && collections.value.length >= currentPlanConfig.value.features.maxCollections) {
    await fetchSubscription()
    if (collections.value.length >= currentPlanConfig.value.features.maxCollections) {
      triggerUpgradeModal('collections')
      return
    }
  }

  overlay.create(SharedCollectionFormModal, {
    props: {
      title: 'Нова колекція',
      onSuccess: () => refresh()
    }
  }).open()
}

const openEditModal = (collection: RecipeCollectionResponseDto) => {
  overlay.create(SharedCollectionFormModal, {
    props: {
      title: 'Редагувати колекцію',
      collection,
      onSuccess: () => refresh()
    }
  }).open()
}

const handleDelete = async (id: string) => {
  overlay.create(SharedConfirmModal, {
    props: {
      title: 'Видалити колекцію?',
      description: 'Ви впевнені, що хочете видалити цю колекцію? Ця дія не видалить самі рецепти, лише їх підбірку.',
      confirmLabel: 'Видалити',
      onConfirm: async () => {
        try {
          await deleteCollection(id)
          refresh()
        } catch (e) {}
      }
    }
  }).open()
}
</script>

<template>
  <div class="w-full">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-8">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black font-heading text-smak-neutral-900 dark:text-white mb-1 sm:mb-2">
          Мої колекції
        </h1>
        <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
          Створюйте тематичні підбірки рецептів для зручного доступу.
        </p>
      </div>

      <UButton 
        size="lg" 
        class="hidden sm:inline-flex shrink-0 rounded-full font-bold px-7 py-3 bg-coral-500 hover:bg-coral-600 text-white shadow-md shadow-coral-500/25 hover:scale-105 transition-all cursor-pointer border-0 items-center justify-center gap-2"
        @click="openCreateModal"
      >
        <UIcon name="i-lucide-plus" class="w-5 h-5" />
        Створити колекцію
      </UButton>
    </div>

    <!-- Floating Action Button for Mobile -->
    <button
      type="button"
      class="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-coral-500 hover:bg-coral-600 text-white shadow-xl shadow-coral-500/40 hover:scale-105 transition-all cursor-pointer flex items-center justify-center border-0"
      aria-label="Створити колекцію"
      @click="openCreateModal"
    >
      <UIcon name="i-lucide-plus" class="w-7 h-7" />
    </button>

    <!-- Collections Grid -->
    <div class="min-h-100">
      <div v-if="pending && !collections" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 6" :key="i" class="h-48 rounded-3xl" />
      </div>

      <div v-else-if="collections && collections.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="collection in collections" 
          :key="collection.id"
          class="group bg-white dark:bg-smak-neutral-900 rounded-4xl border border-smak-neutral-100 dark:border-smak-neutral-800 p-6 hover:shadow-xl hover:shadow-coral-500/5 hover:border-coral-200 dark:hover:border-coral-900/30 transition-all duration-500 flex flex-col relative overflow-hidden"
        >
          <!-- Background Decoration -->
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-coral-500/5 rounded-full blur-3xl group-hover:bg-coral-500/10 transition-colors"></div>
          
          <div class="flex items-start justify-between mb-4 relative z-10">
            <div class="w-14 h-14 rounded-2xl bg-coral-50 dark:bg-coral-950/30 flex items-center justify-center text-coral-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <UIcon name="i-lucide-bookmark" class="w-7 h-7" />
            </div>
            
            <UDropdownMenu 
              v-if="!collection.isSystem"
              :items="[
                [
                  { label: 'Редагувати', icon: 'i-lucide-edit', onSelect: () => openEditModal(collection) },
                  { label: 'Видалити', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => handleDelete(collection.id) }
                ]
              ]"
            >
              <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" class="rounded-full cursor-pointer" />
            </UDropdownMenu>
          </div>

          <NuxtLink :to="`/profile/collections/${collection.id}`" class="flex-1 flex flex-col">
            <h3 class="text-xl font-bold text-smak-neutral-900 dark:text-white mb-2 group-hover:text-coral-500 transition-colors">
              {{ collection.name }}
            </h3>
            <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 line-clamp-2 mb-6">
              {{ collection.description || 'Немає опису' }}
            </p>
            
            <div class="mt-auto flex items-center justify-end">
              <div class="text-xs font-bold text-coral-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                Переглянути <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Locked Card for FREE plan users -->
        <div 
          v-if="isFreePlan"
          class="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col items-center text-center space-y-4 my-2 select-none animate-fade-in"
        >
          <div class="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
            <UIcon name="i-lucide-lock" class="w-6 h-6" />
          </div>

          <div class="space-y-1.5 max-w-md mx-auto">
            <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white">
              Більше колекцій з PRO
            </h3>
            <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
              Створюйте до 10 тематичних колекцій рецептів на тарифі PRO та безлімітно на тарифі PREMIUM.
            </p>
          </div>

          <div class="pt-1">
            <UButton
              variant="outline"
              color="neutral"
              size="xl"
              class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-coral-300 hover:text-coral-500 dark:hover:border-coral-700 dark:hover:text-coral-400 transition-smooth cursor-pointer px-8"
              @click="() => { navigateTo('/billing/plans') }"
            >
              Розблокувати
            </UButton>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-24 h-24 bg-coral-50 dark:bg-coral-950/20 rounded-full flex items-center justify-center text-coral-500 mb-6">
          <UIcon name="i-lucide-bookmark" class="w-12 h-12" />
        </div>
        <h2 class="text-xl sm:text-2xl font-black font-heading text-smak-neutral-900 dark:text-white mb-2">
          У вас ще немає колекцій
        </h2>
        <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-sm mb-8">
          Створюйте підбірки рецептів, щоб вони завжди були під рукою!
        </p>
        <UButton 
          size="lg" 
          class="shrink-0 rounded-full font-bold px-7 py-3 bg-coral-500 hover:bg-coral-600 text-white shadow-md shadow-coral-500/25 hover:scale-105 transition-all cursor-pointer border-0 flex items-center justify-center gap-2"
          @click="openCreateModal"
        >
          <UIcon name="i-lucide-plus" class="w-5 h-5" />
          Створити першу колекцію
        </UButton>
      </div>
    </div>
  </div>
</template>
