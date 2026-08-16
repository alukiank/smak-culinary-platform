<!--
@page-docs
title: Detailed Collection view
description: View details of a specific recipe collection created by the user. Displays all grouped recipes in that folder.
features:
  - Edit collection: rename or edit description of this collection.
  - Delete collection: delete the entire collection folder (recipes are kept).
  - Remove recipe: remove a specific recipe from this collection with confirmation modal.
  - Navigation: link to go back to all collections (/profile/collections) or start exploring recipes catalog (/recipes).
-->

<script setup lang="ts">
import type { RecipeCollectionResponseDto } from '~/types/collection'
import { SharedCollectionFormModal, SharedConfirmModal } from '#components'

definePageMeta({
  middleware: 'auth',
  layout: 'profile'
})

const route = useRoute()
const collectionId = route.params.id as string
const { getCollection, removeRecipeFromCollection, deleteCollection } = useCollections()
const toast = useToast()
const router = useRouter()
const overlay = useOverlay()

const { data: collection, refresh, pending, error } = await useAsyncData(
  `collection-${collectionId}`,
  () => getCollection(collectionId)
)

useSeoMeta({
  title: () => collection.value ? `Smak | ${collection.value.name}` : 'Smak | Колекція'
})

const handleRemoveRecipe = async (recipeId: string) => {
  overlay.create(SharedConfirmModal, {
    props: {
      title: 'Прибрати з колекції?',
      description: 'Ви впевнені, що хочете прибрати цей рецепт з поточної підбірки?',
      confirmLabel: 'Прибрати',
      onConfirm: async () => {
        try {
          await removeRecipeFromCollection(collectionId, recipeId)
          refresh()
        } catch (e) {}
      }
    }
  }).open()
}

const handleDeleteCollection = async () => {
  overlay.create(SharedConfirmModal, {
    props: {
      title: 'Видалити колекцію?',
      description: 'Ви впевнені, що хочете видалити всю колекцію? Рецепти залишаться в системі, але підбірка зникне.',
      confirmLabel: 'Видалити',
      onConfirm: async () => {
        try {
          await deleteCollection(collectionId)
          router.push('/profile/collections')
        } catch (e) {}
      }
    }
  }).open()
}

const openEditModal = () => {
  if (!collection.value) return
  
  overlay.create(SharedCollectionFormModal, {
    props: {
      title: 'Редагувати колекцію',
      collection: collection.value,
      onSuccess: () => refresh()
    }
  }).open()
}
</script>

<template>
  <div class="w-full">
    <div v-if="pending && !collection" class="space-y-8">
      <USkeleton class="h-24 w-full rounded-3xl" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 3" :key="i" class="h-80 rounded-3xl" />
      </div>
    </div>

    <div v-else-if="error" class="text-center py-20">
      <UIcon name="i-lucide-alert-triangle" class="w-16 h-16 text-rose-500 mb-4" />
      <h2 class="text-2xl font-bold mb-4">Колекцію не знайдено</h2>
      <UButton to="/profile/collections" color="primary">Повернутися до списку</UButton>
    </div>

    <div v-else-if="collection" class="space-y-10">
      <!-- Header -->
      <div class="bg-white dark:bg-smak-neutral-900 rounded-[2.5rem] border border-smak-neutral-100 dark:border-smak-neutral-800 p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-coral-500/5 rounded-full blur-3xl"></div>
        
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-4">
              <NuxtLink to="/profile/collections" class="text-sm font-bold text-coral-500 hover:underline flex items-center gap-1">
                <UIcon name="i-lucide-chevron-left" class="w-4 h-4" /> Мої колекції
              </NuxtLink>
            </div>
            
            <div class="flex items-center gap-4 mb-3">
              <div class="w-12 h-12 rounded-2xl bg-coral-500 text-white flex items-center justify-center shadow-lg shadow-coral-500/20">
                <UIcon name="i-lucide-bookmark" class="w-6 h-6" />
              </div>
              <h1 class="text-3xl sm:text-4xl font-black font-heading text-smak-neutral-900 dark:text-white">
                {{ collection.name }}
              </h1>
            </div>
            
            <p v-if="collection.description" class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-2xl">
              {{ collection.description }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <UDropdownMenu 
              v-if="!collection.isSystem"
              :items="[
                [
                  { label: 'Редагувати', icon: 'i-lucide-edit', onSelect: openEditModal },
                  { label: 'Видалити колекцію', icon: 'i-lucide-trash-2', color: 'error', onSelect: handleDeleteCollection }
                ]
              ]"
            >
              <UButton color="neutral" variant="soft" icon="i-lucide-settings-2" size="xl" class="rounded-2xl cursor-pointer" />
            </UDropdownMenu>
          </div>
        </div>
      </div>

      <div v-if="collection.recipes && collection.recipes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="recipe in collection.recipes" :key="recipe.id" class="relative group/card">
          <RecipeCard :recipe="recipe" />
          
          <!-- Remove from collection button -->
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="solid"
            size="xs"
            class="absolute top-4 right-4 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-full shadow-lg z-20 cursor-pointer bg-white/90 dark:bg-smak-neutral-900/90 text-smak-neutral-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            title="Видалити з цієї колекції"
            @click.stop="handleRemoveRecipe(recipe.id)"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-24 h-24 bg-coral-50 dark:bg-coral-950/20 rounded-full flex items-center justify-center text-coral-500 mb-6">
          <UIcon name="i-lucide-utensils" class="w-12 h-12 opacity-30" />
        </div>
        <h2 class="text-xl sm:text-2xl font-black font-heading text-smak-neutral-900 dark:text-white mb-2">У цій колекції ще порожньо</h2>
        <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-sm mb-8">
          Додайте сюди ваші улюблені рецепти, щоб вони не загубилися!
        </p>
        <UButton to="/recipes" color="primary" size="xl" class="rounded-2xl font-bold px-10 shadow-lg shadow-primary-500/20">
          Шукати рецепти
        </UButton>
      </div>
    </div>
  </div>
</template>
