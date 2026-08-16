<!--
@page-docs
title: Step-by-Step Cook Mode
description: Interactive step-by-step cooking interface that guides the user through cooking a selected recipe, with timer integrations and a dedicated real-time culinary AI assistant.
features:
  - Ingredient checklist: inspect and verify available and missing ingredients, with automated AI replacement suggestions.
  - Step wizard: view one step at a time with clean bold typography and swipe navigation.
  - Smart step timers: automatically detects time mentions in directions and provides interactive count-down timers.
  - Interactive cooking timeline: list of all preparation steps that are clickable to skip or backtrack.
  - Guided AI assistant: dedicated sliding panel with chat to ask questions specifically matching the current cooking step.
-->

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipes } from '~/composables/useRecipes'
import type { RecipeResponseDto } from '~/types/recipe'

// ─── Layout ───────────────────────────────────────────────────────────────────
definePageMeta({
  layout: 'cook',
  middleware: ['auth'],
})

// ─── Data ─────────────────────────────────────────────────────────────────────
const route = useRoute()
const toast = useToast()
const { fetchRecipeById } = useRecipes()

const recipeId = route.params.id as string

const { data: recipe, pending, error } = await useAsyncData<RecipeResponseDto>(
  `cook-recipe-${recipeId}`,
  () => fetchRecipeById(recipeId),
)

// SEO
useSeoMeta({
  title: computed(() => recipe.value ? `Smak | Приготування: ${recipe.value.title}` : 'Smak | Режим готування'),
})

// ─── Ingredient state: unchecked | available | missing ────────────────────────
type IngStatus = 'unchecked' | 'available' | 'missing'

const ingredientStatus = ref<Record<string, IngStatus>>({})

/**
 * Set an ingredient to a specific status.
 * If already in that status — toggle back to unchecked.
 */
const setIngredientStatus = (ing: string, status: 'available' | 'missing') => {
  const current = ingredientStatus.value[ing] ?? 'unchecked'
  const next: IngStatus = current === status ? 'unchecked' : status
  ingredientStatus.value = { ...ingredientStatus.value, [ing]: next }
}

const availableIngredients = computed(() =>
  (recipe.value?.ingredients ?? []).filter(
    (ing) => (ingredientStatus.value[ing] ?? 'unchecked') === 'available',
  ),
)

const missingIngredients = computed(() =>
  (recipe.value?.ingredients ?? []).filter(
    (ing) => (ingredientStatus.value[ing] ?? 'unchecked') === 'missing',
  ),
)

const uncheckedCount = computed(() =>
  (recipe.value?.ingredients ?? []).filter(
    (ing) => (ingredientStatus.value[ing] ?? 'unchecked') === 'unchecked',
  ).length,
)

// ─── Tab switcher ─────────────────────────────────────────────────────────────
const activeTab = ref<'ingredients' | 'wizard' | 'steps'>('ingredients')

// ─── Step logic ───────────────────────────────────────────────────────────────
const currentCookStep = ref(0)

const prevCookStep = () => {
  if (currentCookStep.value > 0) {
    pauseStepTimer()
    stepTimerSeconds.value = 0
    currentCookStep.value--
  }
}

const nextCookStep = () => {
  if (recipe.value && currentCookStep.value < recipe.value.directions.length - 1) {
    pauseStepTimer()
    stepTimerSeconds.value = 0
    currentCookStep.value++
  }
}

// ─── Step Timer ───────────────────────────────────────────────────────────────
const stepTimerSeconds = ref(0)
const stepTimerRunning = ref(false)
const timerIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

const stepTimerMinutes = computed(() => {
  if (!recipe.value) return 0
  const stepText = recipe.value.directions[currentCookStep.value] || ''
  const match = stepText.match(/(\d+)\s*хв/i) || stepText.match(/(\d+)\s*хвилин/i)
  return match?.[1] ? parseInt(match[1]) : 0
})

const formatTimerValue = (totalSec: number) => {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

const startStepTimer = () => {
  if (timerIntervalId.value) clearInterval(timerIntervalId.value)
  stepTimerSeconds.value = stepTimerMinutes.value * 60
  stepTimerRunning.value = true
  timerIntervalId.value = setInterval(() => {
    if (stepTimerSeconds.value > 0) {
      stepTimerSeconds.value--
    } else {
      pauseStepTimer()
      if (import.meta.client) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'sine'; osc.frequency.value = 880
          gain.gain.setValueAtTime(0.1, ctx.currentTime)
          osc.start(); osc.stop(ctx.currentTime + 0.6)
        } catch {}
      }
      toast.add({ title: 'Час вийшов!', description: `Таймер кроку ${currentCookStep.value + 1} завершено.`, color: 'primary' })
    }
  }, 1000)
}

const pauseStepTimer = () => {
  stepTimerRunning.value = false
  if (timerIntervalId.value) { clearInterval(timerIntervalId.value); timerIntervalId.value = null }
}

const resumeStepTimer = () => {
  stepTimerRunning.value = true
  timerIntervalId.value = setInterval(() => {
    if (stepTimerSeconds.value > 0) stepTimerSeconds.value--
    else pauseStepTimer()
  }, 1000)
}

// ─── AI panel toggle (mobile) ────────────────────────────────────────────────
const isAiPanelOpen = ref(false)

// ─── Completion ───────────────────────────────────────────────────────────────
const handleCompleted = () => {
  toast.add({ title: 'Вітаємо! 🎉', description: 'Ви успішно приготували страву! Смачного!', color: 'success' })
  navigateTo(`/recipes/${recipeId}`)
}

// ─── Back to recipe ───────────────────────────────────────────────────────────
const goBack = () => {
  pauseStepTimer()
  navigateTo(`/recipes/${recipeId}`)
}

onBeforeUnmount(() => pauseStepTimer())
</script>

<template>
  <div class="flex flex-col h-screen select-none bg-white dark:bg-smak-neutral-950 text-left overflow-hidden">

    <!-- ─── Error state ──────────────────────────────────────────────────── -->
    <div
      v-if="error"
      class="flex flex-col items-center justify-center h-full gap-4 text-center px-6"
    >
      <div class="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
        <UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-rose-500 animate-bounce" />
      </div>
      <h2 class="font-heading font-bold text-2xl text-rose-700 dark:text-rose-400">Рецепт не знайдено</h2>
      <UButton color="primary" class="rounded-xl font-bold" @click="goBack">← Назад</UButton>
    </div>

    <!-- ─── Loading ─────────────────────────────────────────────────────── -->
    <div v-else-if="pending" class="flex items-center justify-center h-full">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 rounded-full border-2 border-coral-500/30 border-t-coral-500 animate-spin" />
        <p class="text-xs font-bold text-smak-neutral-400">Завантаження рецепту...</p>
      </div>
    </div>

    <!-- ─── Main cook mode ─────────────────────────────────────────────── -->
    <template v-else-if="recipe">

      <!-- Header -->
      <header class="relative h-16 sm:h-20 border-b border-smak-neutral-100 dark:border-smak-neutral-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 bg-white/80 dark:bg-smak-neutral-950/80 backdrop-blur-md z-20 transition-all duration-300">
        <!-- Left Side: Mobile Back Button & Desktop Title Block -->
        <div class="flex items-center gap-2.5 z-10 min-w-0">
          <!-- Mobile Back Button (Visible only on mobile screen < sm, aligned left) -->
          <button
            @click="goBack"
            class="sm:hidden p-2 rounded-xl border border-smak-neutral-200/60 dark:border-smak-neutral-800/80 hover:border-coral-500 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 text-smak-neutral-500 hover:text-coral-500 transition-all duration-300 focus:outline-none cursor-pointer flex items-center justify-center shrink-0 z-10"
            title="Повернутися до рецепту"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
          </button>

          <!-- Desktop Title block (pot icon and title are hidden on mobile) -->
          <div class="hidden sm:flex items-center gap-2.5 min-w-0 max-w-xs md:max-w-md">
            <div class="w-9 h-9 rounded-xl bg-coral-500/10 flex items-center justify-center text-coral-500 shrink-0 shadow-xs">
              <UIcon name="i-lucide-cooking-pot" class="w-5 h-5 animate-pulse" />
            </div>
            
            <div class="min-w-0">
              <p class="hidden md:block text-[10px] sm:text-xs text-smak-neutral-400 dark:text-smak-neutral-500 uppercase tracking-widest font-extrabold">Режим готування</p>
              <h1 class="text-xs sm:text-sm md:text-lg text-smak-neutral-900 dark:text-white font-black tracking-tight truncate leading-tight">
                {{ recipe.title }}
              </h1>
            </div>
          </div>
        </div>

        <!-- Tab Switcher (Absolutely Centered and Independent of Left/Right widths) -->
        <div class="absolute inset-x-0 flex justify-center pointer-events-none z-0">
          <div class="pointer-events-auto flex items-center bg-smak-neutral-50/90 dark:bg-smak-neutral-900/80 p-1.5 rounded-2xl border border-smak-neutral-100/50 dark:border-white/5 select-none shadow-inner">
            <button
              v-for="tab in [
                { id: 'ingredients', label: 'Інгредієнти', icon: 'i-lucide-shopping-basket' },
                { id: 'wizard', label: 'Покроково', icon: 'i-lucide-play-circle' },
                { id: 'steps', label: 'План кроків', icon: 'i-lucide-list-ordered' },
              ]"
              :key="tab.id"
              @click="activeTab = tab.id as any"
              class="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer border-none focus:outline-none"
              :class="[
                activeTab === tab.id
                  ? 'bg-coral-500 text-white shadow-md shadow-coral-500/20'
                  : 'text-smak-neutral-500 dark:text-smak-neutral-400 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 hover:text-smak-neutral-800 dark:hover:text-white bg-transparent',
              ]"
            >
              <UIcon :name="tab.icon" class="w-4.5 h-4.5 shrink-0" />
              <span class="hidden md:inline">{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- Right Side: Mobile AI Toggle & Desktop Back Button -->
        <div class="flex items-center justify-end z-10 shrink-0 gap-2">
          <!-- Mobile AI toggle (only on wizard tab) -->
          <button
            v-if="activeTab === 'wizard'"
            @click="isAiPanelOpen = !isAiPanelOpen"
            class="md:hidden p-2 rounded-xl border border-smak-neutral-200 dark:border-smak-neutral-800/80 hover:border-ai-indigo-500 hover:bg-ai-indigo-50/10 text-smak-neutral-500 hover:text-ai-indigo-500 transition-all duration-300 focus:outline-none cursor-pointer flex items-center justify-center shadow-xs"
            :title="isAiPanelOpen ? 'Закрити помічника' : 'ШІ-помічник'"
          >
            <Transition name="fade-rotate" mode="out-in">
              <UIcon
                :key="isAiPanelOpen ? 'close' : 'sparkles'"
                :name="isAiPanelOpen ? 'i-lucide-x' : 'i-lucide-sparkles'"
                class="w-5 h-5 transition-colors duration-305"
                :class="{ 'text-ai-indigo-500': isAiPanelOpen }"
              />
            </Transition>
          </button>

          <!-- Desktop Back Button (Visible only on screen >= sm, aligned right) -->
          <button
            @click="goBack"
            class="hidden sm:flex group items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-smak-neutral-200/60 dark:border-smak-neutral-800/80 hover:border-coral-500 dark:hover:border-coral-400 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 text-smak-neutral-500 hover:text-coral-500 dark:hover:text-coral-400 transition-all duration-300 focus:outline-none cursor-pointer shadow-xs"
            title="Повернутися до рецепту"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-300" />
            <span class="hidden sm:inline text-xs font-black uppercase tracking-wider">Повернутися до рецепту</span>
          </button>
        </div>
      </header>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex flex-col">

        <!-- ── TAB 1: INGREDIENTS ─────────────────────────────────────── -->
        <div v-if="activeTab === 'ingredients'" class="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div class="max-w-4xl mx-auto px-6 py-6 sm:px-10 sm:py-10">
            <div class="flex flex-col">
              <div class="text-center md:text-left mb-6">
                <h2 class="text-xl sm:text-2xl font-black text-smak-neutral-900 dark:text-white font-heading">
                  Підготовка інгредієнтів
                </h2>
                <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 mt-1 leading-relaxed font-semibold">
                  Для кожного інгредієнта натисніть <strong class="text-emerald-600 dark:text-emerald-400">Є</strong> — якщо він у вас є, або <strong class="text-rose-500">Немає</strong> — якщо відсутній. ШІ запропонує заміну.
                </p>
              </div>

              <!-- Stats bar -->
              <div class="bg-smak-neutral-50 dark:bg-smak-neutral-900/60 p-4 rounded-2xl border border-smak-neutral-100/50 dark:border-white/5 mb-6">
                <div class="flex items-center justify-between text-xs font-bold text-smak-neutral-700 dark:text-smak-neutral-300 mb-3">
                  <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <UIcon name="i-lucide-check-circle-2" class="w-3.5 h-3.5" />
                      {{ availableIngredients.length }} є
                    </span>
                    <span v-if="missingIngredients.length > 0" class="flex items-center gap-1 text-rose-500">
                      <UIcon name="i-lucide-x-circle" class="w-3.5 h-3.5" />
                      {{ missingIngredients.length }} відсутніх
                    </span>
                    <span v-if="uncheckedCount > 0" class="flex items-center gap-1 text-smak-neutral-400">
                      <UIcon name="i-lucide-circle" class="w-3.5 h-3.5" />
                      {{ uncheckedCount }} не відмічено
                    </span>
                  </div>
                  <span>з {{ recipe.ingredients.length }}</span>
                </div>
                <!-- Progress bar (available = green portion, missing = red) -->
                <div class="w-full bg-smak-neutral-100 dark:bg-smak-neutral-800 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    class="bg-emerald-500 h-full transition-all duration-500"
                    :style="{ width: `${(availableIngredients.length / recipe.ingredients.length) * 100}%` }"
                  />
                  <div
                    class="bg-rose-400 h-full transition-all duration-500"
                    :style="{ width: `${(missingIngredients.length / recipe.ingredients.length) * 100}%` }"
                  />
                </div>
              </div>

              <!-- Missing warning alert (collapses smoothly and slides items down using GPU grid rows) -->
              <div
                class="grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                :class="[
                  missingIngredients.length > 0
                    ? 'grid-rows-[1fr] opacity-100 mb-6'
                    : 'grid-rows-[0fr] opacity-0 pointer-events-none mb-0'
                ]"
              >
                <div class="min-h-0">
                  <div class="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                    <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p class="text-xs font-bold text-amber-700 dark:text-amber-400">Відсутні інгредієнти</p>
                      <p class="text-xs text-amber-600/80 dark:text-amber-500/80 font-semibold mt-0.5 leading-relaxed">
                        ШІ-помічник допоможе знайти заміну для: <strong>{{ missingIngredients.join(', ') }}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ingredient list with explicit action buttons -->
              <div class="space-y-2 mb-6">
                <div
                  v-for="ing in recipe.ingredients"
                  :key="ing"
                  class="flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200"
                  :class="[
                    ingredientStatus[ing] === 'available'
                      ? 'border-emerald-300/50 dark:border-emerald-700/30 bg-emerald-50/60 dark:bg-emerald-950/10'
                      : ingredientStatus[ing] === 'missing'
                        ? 'border-rose-300/50 dark:border-rose-700/30 bg-rose-50/60 dark:bg-rose-950/10'
                        : 'border-smak-neutral-100/50 dark:border-white/5 bg-white dark:bg-smak-neutral-900',
                  ]"
                >
                  <!-- Status dot -->
                  <div
                    class="w-2 h-2 rounded-full shrink-0 transition-all duration-200"
                    :class="[
                      ingredientStatus[ing] === 'available'
                        ? 'bg-emerald-500'
                        : ingredientStatus[ing] === 'missing'
                          ? 'bg-rose-500'
                          : 'bg-smak-neutral-200 dark:bg-smak-neutral-700',
                    ]"
                  />

                  <!-- Ingredient name -->
                  <span
                    class="flex-1 text-sm font-semibold leading-snug"
                    :class="[
                      ingredientStatus[ing] === 'available'
                        ? 'line-through text-smak-neutral-400 dark:text-smak-neutral-600'
                        : ingredientStatus[ing] === 'missing'
                          ? 'line-through text-rose-400 dark:text-rose-600'
                          : 'text-smak-neutral-800 dark:text-smak-neutral-200',
                    ]"
                  >
                    {{ ing }}
                  </span>

                  <!-- Explicit action buttons -->
                  <div class="flex items-center gap-1.5 shrink-0">
                    <!-- "Є" button -->
                    <button
                      @click="setIngredientStatus(ing, 'available')"
                      class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer focus:outline-none"
                      :class="[
                        ingredientStatus[ing] === 'available'
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'bg-white dark:bg-smak-neutral-800 border-smak-neutral-200 dark:border-smak-neutral-700 text-smak-neutral-500 dark:text-smak-neutral-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                      ]"
                      :title="ingredientStatus[ing] === 'available' ? 'Скасувати' : 'Є вдома'"
                    >
                      <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
                      <span>Є</span>
                    </button>

                    <!-- "Немає" button -->
                    <button
                      @click="setIngredientStatus(ing, 'missing')"
                      class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer focus:outline-none"
                      :class="[
                        ingredientStatus[ing] === 'missing'
                          ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/30'
                          : 'bg-white dark:bg-smak-neutral-800 border-smak-neutral-200 dark:border-smak-neutral-700 text-smak-neutral-500 dark:text-smak-neutral-400 hover:border-rose-400 hover:text-rose-500 dark:hover:text-rose-400',
                      ]"
                      :title="ingredientStatus[ing] === 'missing' ? 'Скасувати' : 'Немає вдома'"
                    >
                      <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                      <span>Немає</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <div class="flex justify-center pt-4">
                <UButton
                  color="primary"
                  size="md"
                  class="rounded-2xl font-black px-8 py-3.5 tracking-widest uppercase text-xs"
                  @click="() => { activeTab = 'wizard' }"
                >
                  <span>Розпочати покрокове готування</span>
                  <UIcon name="i-lucide-arrow-right" class="w-4 h-4 ml-1.5" />
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- ── TAB 2: WIZARD + AI CHAT ────────────────────────────────── -->
        <div v-if="activeTab === 'wizard'" class="flex-1 overflow-hidden flex flex-col md:flex-row relative">

          <!-- Step Wizard Column (Left/Middle, holds instructions and step footer navigation) -->
          <div
            class="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300"
            :class="{ 'hidden md:flex': isAiPanelOpen }"
          >
            <!-- Step instructions (scrollable content) -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 flex flex-col justify-center items-center text-center space-y-6">
              <div class="space-y-2">
                <span class="px-4 py-1.5 bg-coral-50 dark:bg-coral-950/30 text-coral-600 dark:text-coral-400 rounded-full text-xs font-display font-black uppercase tracking-widest shadow-xs">
                  Крок {{ currentCookStep + 1 }} із {{ recipe.directions.length }}
                </span>
              </div>

              <p class="text-xl sm:text-2xl md:text-3xl text-smak-neutral-900 dark:text-white font-semibold font-heading leading-relaxed max-w-3xl py-4 select-text">
                {{ recipe.directions[currentCookStep] }}
              </p>

              <!-- Step timer -->
              <div v-if="stepTimerMinutes > 0" class="bg-coral-50/30 dark:bg-coral-950/10 border border-coral-100/50 dark:border-coral-900/20 p-6 rounded-3xl max-w-md w-full flex flex-col items-center gap-4">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-timer" class="w-5 h-5 text-coral-500" />
                  <span class="text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider">
                    Знайдено таймер: {{ stepTimerMinutes }} хв
                  </span>
                </div>
                <div class="font-display font-black text-4xl sm:text-5xl text-smak-neutral-900 dark:text-white tracking-widest">
                  {{ formatTimerValue(stepTimerSeconds > 0 ? stepTimerSeconds : stepTimerMinutes * 60) }}
                </div>
                <div class="flex items-center gap-3">
                  <UButton v-if="stepTimerSeconds === 0" color="primary" class="rounded-xl font-bold px-4 py-2" @click="startStepTimer">Запустити</UButton>
                  <template v-else>
                    <UButton v-if="stepTimerRunning" color="neutral" variant="subtle" class="rounded-xl font-bold px-4 py-2" @click="pauseStepTimer">Пауза</UButton>
                    <UButton v-else color="primary" class="rounded-xl font-bold px-4 py-2" @click="resumeStepTimer">Продовжити</UButton>
                    <button 
                      type="button" 
                      class="rounded-xl font-bold px-4 py-2 bg-transparent hover:bg-transparent text-smak-neutral-700 dark:text-smak-neutral-300 border border-transparent hover:border-coral-500 hover:text-coral-500 transition-all cursor-pointer text-sm"
                      @click="() => { stepTimerSeconds = 0; pauseStepTimer() }"
                    >
                      Скинути
                    </button>
                  </template>
                </div>
              </div>
            </div>

            <!-- ─── Footer (wizard only, aligned with the steps column) ─── -->
            <footer
              class="h-18 border-t border-smak-neutral-100 dark:border-smak-neutral-800/80 px-6 sm:px-10 flex items-center justify-between shrink-0 bg-white dark:bg-smak-neutral-950 select-none"
            >
              <UButton variant="outline" color="neutral" size="md" class="rounded-xl font-bold px-5" @click="prevCookStep" :disabled="currentCookStep === 0">
                Назад
              </UButton>

              <div class="hidden sm:flex items-center gap-1.5">
                <span
                  v-for="(_, idx) in recipe.directions"
                  :key="idx"
                  class="h-2.5 rounded-full transition-all duration-300"
                  :class="[currentCookStep === idx ? 'bg-coral-500 w-5' : 'bg-smak-neutral-200 dark:bg-smak-neutral-800 w-2.5']"
                />
              </div>

              <UButton
                v-if="currentCookStep < recipe.directions.length - 1"
                color="primary"
                size="md"
                class="rounded-xl font-bold px-5"
                @click="nextCookStep"
              >
                Наступний крок
              </UButton>
              <UButton
                v-else
                color="success"
                size="md"
                class="rounded-xl font-bold px-5 flex items-center gap-1.5"
                @click="handleCompleted"
              >
                <UIcon name="i-lucide-party-popper" class="w-4.5 h-4.5" />
                <span>Завершити</span>
              </UButton>
            </footer>
          </div>

          <!-- Mobile Backdrop Overlay -->
          <Transition name="fade">
            <div
              v-if="isAiPanelOpen"
              @click="isAiPanelOpen = false"
              class="md:hidden fixed inset-0 bg-smak-neutral-950/20 dark:bg-black/40 backdrop-blur-xs z-25 cursor-pointer"
            />
          </Transition>

          <!-- AI Chat panel (right, slides smoothly from the right on mobile) -->
          <div
            class="md:w-[420px] border-smak-neutral-100 dark:border-smak-neutral-800/80 bg-smak-neutral-50 dark:bg-smak-neutral-900/60 shrink-0 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :class="[
              isAiPanelOpen
                ? 'fixed inset-0 z-30 translate-x-0 pointer-events-auto border-0 md:relative md:inset-auto md:z-auto md:translate-x-0 md:pointer-events-auto md:flex md:border-l'
                : 'fixed inset-0 z-30 translate-x-full pointer-events-none border-0 md:relative md:inset-auto md:z-auto md:translate-x-0 md:pointer-events-auto md:flex md:border-l',
            ]"
          >
            <!-- Mobile close AI panel removed to eliminate triple header -->

            <RecipeModalsCookModeAiChat
              :recipe="recipe"
              :missing-ingredients="missingIngredients"
              :current-step="currentCookStep"
              @close="isAiPanelOpen = false"
              class="flex-1 min-h-0"
            />
          </div>
        </div>

        <!-- ── TAB 3: STEPS PLAN ──────────────────────────────────────── -->
        <div v-if="activeTab === 'steps'" class="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div class="max-w-4xl mx-auto px-6 py-6 sm:px-10 sm:py-10">
            <div class="space-y-6">
              <div class="text-center md:text-left">
                <h2 class="text-xl sm:text-2xl font-black text-smak-neutral-900 dark:text-white font-heading">
                  План приготування
                </h2>
                <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 mt-1 leading-relaxed font-semibold">
                  Повний список кроків. Натисніть на крок, щоб перейти до нього.
                </p>
              </div>

              <div class="relative pl-6 sm:pl-8 border-l-2 border-smak-neutral-100 dark:border-white/5 space-y-6 ml-3 sm:ml-4 text-left">
                <div
                  v-for="(step, sIdx) in recipe.directions"
                  :key="sIdx"
                  @click="currentCookStep = sIdx; activeTab = 'wizard'; pauseStepTimer(); stepTimerSeconds = 0"
                  class="relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer bg-white dark:bg-smak-neutral-900 hover:scale-[1.01]"
                  :class="[
                    currentCookStep === sIdx
                      ? 'border-coral-500 shadow-sm shadow-coral-500/5 ring-1 ring-coral-500/20'
                      : 'border-smak-neutral-100/50 dark:border-white/5 hover:border-coral-200 dark:hover:border-coral-900/30',
                  ]"
                >
                  <div
                    class="absolute left-[-35px] sm:left-[-43px] top-6 w-5 h-5 rounded-full border-2 bg-white dark:bg-smak-neutral-950 flex items-center justify-center transition-all duration-300"
                    :class="[
                      currentCookStep === sIdx
                        ? 'border-coral-500 scale-125 ring-4 ring-coral-500/10'
                        : sIdx < currentCookStep
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-smak-neutral-200 dark:border-smak-neutral-800',
                    ]"
                  >
                    <UIcon v-if="sIdx < currentCookStep" name="i-lucide-check" class="w-3 h-3 text-emerald-500 font-extrabold" />
                    <span v-else class="w-1.5 h-1.5 rounded-full bg-smak-neutral-400 dark:bg-smak-neutral-600" :class="[currentCookStep === sIdx ? 'bg-coral-500' : '']" />
                  </div>

                  <div class="flex items-center justify-between gap-3 mb-2">
                    <span class="text-xs font-display font-black uppercase tracking-wider" :class="[currentCookStep === sIdx ? 'text-coral-500' : 'text-smak-neutral-400 dark:text-smak-neutral-500']">
                      Крок {{ sIdx + 1 }}
                    </span>
                    <span v-if="currentCookStep === sIdx" class="px-2.5 py-0.5 rounded-full bg-coral-500/10 text-coral-500 text-[10px] font-black uppercase tracking-wider">Поточний</span>
                    <span v-else-if="sIdx < currentCookStep" class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider">Виконано</span>
                  </div>

                  <p class="text-sm font-semibold leading-relaxed" :class="[currentCookStep === sIdx ? 'text-smak-neutral-900 dark:text-white' : 'text-smak-neutral-500 dark:text-smak-neutral-400']">
                    {{ step }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Original footer block removed from root level -->

    </template>
  </div>
</template>

<style scoped>
/* Fade-rotate transition for mobile AI assistant close/toggle button */
.fade-rotate-enter-active,
.fade-rotate-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-rotate-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.85);
}
.fade-rotate-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.85);
}

/* Fade transition for mobile backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Premium custom scrollbar styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(120, 120, 120, 0.25);
  border-radius: 99px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: background-color 0.2s ease;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(120, 120, 120, 0.45);
  border: 2px solid transparent;
  background-clip: padding-box;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid transparent;
  background-clip: padding-box;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* Firefox compatibility styles */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 120, 120, 0.25) transparent;
}
.dark .custom-scrollbar {
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
</style>
