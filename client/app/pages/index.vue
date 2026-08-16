<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRecipes } from '~/composables/useRecipes'
import RecipeCard from '~/components/recipe/card/RecipeCard.vue'
import RecipeGridSkeleton from '~/components/recipe/card/RecipeGridSkeleton.vue'

definePageMeta({ fullWidth: true })

useSeoMeta({
  title: 'SMAK | Відкрийте світ смаку разом з нами!',
  description: 'SMAK — кулінарна платформа, де ви знайдете тисячі автентичних рецептів та отримаєте допомогу розумного ШІ-асистента.'
})

const { user } = useUser()
const { recipes, loading, fetchRecipes } = useRecipes('landing')
const openFaq = ref<number | null>(null)

const toggleFaq = (idx: number) => {
  openFaq.value = openFaq.value === idx ? null : idx
}

onMounted(async () => {
  await fetchRecipes({ page: 1, limit: 6 })
})

const faqs = [
  {
    q: 'Що таке SMAK?',
    a: 'SMAK — це кулінарна платформа, де реальні кулінари діляться авторськими рецептами, а ШІ-асистент допомагає знаходити страви, адаптувати їх під ваші інгредієнти та дієту.'
  },
  {
    q: 'Чи потрібна реєстрація для перегляду рецептів?',
    a: 'Ні, переглядати рецепти можна без реєстрації. Але щоб зберігати рецепти у колекцію, публікувати власні та користуватися ШІ-асистентом — потрібен акаунт. Реєстрація безкоштовна.'
  },
  {
    q: 'Як ШІ-асистент допомагає з рецептами?',
    a: 'ШІ-асистент вміє: підбирати рецепти за наявними інгредієнтами, адаптувати страву під вашу дієту або алергії, перераховувати порції, знаходити заміни інгредієнтів та відповідати на будь-які кулінарні запитання.'
  },
  {
    q: 'Чи можу я публікувати власні рецепти?',
    a: 'Так! Після реєстрації ви можете публікувати власні рецепти з фото, описами кроків та секретами приготування. Ваші рецепти побачать усі учасники спільноти.'
  },
  {
    q: 'Чи є мобільний додаток SMAK?',
    a: 'Наразі SMAK доступний як веб-платформа, оптимізована для мобільних пристроїв. Мобільний додаток знаходиться в розробці.'
  }
]
</script>

<template>
  <div class="overflow-x-hidden bg-white dark:bg-smak-neutral-950 transition-colors duration-500 pb-16">

    <!-- ===== 1. HERO BANNER SECTION (FULL WIDTH & EDGE-TO-EDGE ON MOBILE) ===== -->
    <section class="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 pt-0 sm:pt-6 pb-4 sm:pb-6">
      <div class="relative rounded-none sm:rounded-[2.5rem] overflow-hidden bg-linear-to-br from-smak-neutral-950 via-smak-neutral-900 to-smak-neutral-950 text-white min-h-110 sm:min-h-120 lg:min-h-130 flex items-center shadow-2xl border-y sm:border border-smak-neutral-800/60">
        
        <!-- Background Image Container filling full right side & responsive mobile background (No mobile darkening overlay) -->
        <div class="absolute inset-0 grid grid-cols-1 lg:grid-cols-12 pointer-events-none">
          <div class="hidden lg:block lg:col-span-5 bg-linear-to-r from-smak-neutral-950 via-smak-neutral-950/95 to-transparent z-10"></div>
          <div class="lg:col-span-12 relative overflow-hidden h-full">
            <picture class="w-full h-full">
              <!-- Dedicated vertical culinary photo for mobile -->
              <source media="(max-width: 639px)" srcset="/images/mobile_hero_dish.jpg" />
              <!-- Desktop culinary hero photo -->
              <img 
                src="/images/pexels-dhiraj-jain-207743066-12737657.jpg" 
                alt="SMAK Visual" 
                class="w-full h-full object-cover object-center sm:object-[75%_center] lg:object-right opacity-100 transition-opacity duration-500" 
              />
            </picture>
            <!-- Mobile darkening overlay -->
            <div class="absolute inset-0 bg-linear-to-t from-black/60 via-black/45 to-black/40 lg:hidden"></div>
            <!-- Desktop side gradient only -->
            <div class="absolute inset-0 bg-linear-to-r from-smak-neutral-950 via-smak-neutral-950/85 to-transparent hidden lg:block w-3/5"></div>
          </div>
        </div>

        <!-- Content Layer -->
        <div class="relative z-20 max-w-7xl w-full p-6 sm:p-10 lg:p-14">
          <div class="max-w-xl space-y-4 sm:space-y-6 text-left">
            
            <h1 class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black font-heading leading-[1.15] text-white tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
              Відкрийте світ <br class="hidden sm:inline" />
              <span class="text-coral-500 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">смаку</span> разом з нами!
            </h1>

            <p class="text-sm sm:text-base text-white/95 sm:text-smak-neutral-200/90 font-medium leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.95)]">
              Розкрийте свій кулінарний потенціал легко та просто разом з розумним ШІ-помічником SMAK — шукайте автентичні рецепти, адаптуйте інгредієнти та створюйте кулінарні шедеври щодня.
            </p>

            <!-- Action Buttons: Moved slightly lower on mobile, inline pills on tablet/desktop -->
            <div class="pt-5 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <!-- Primary Dark Button -->
              <NuxtLink 
                to="/recipes" 
                class="w-full sm:w-auto justify-center inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-smak-neutral-900/95 hover:bg-black text-white font-extrabold text-sm sm:text-base border border-smak-neutral-700/80 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <span>Дослідити рецепти</span>
                <div class="w-7 h-7 rounded-full bg-white text-smak-neutral-950 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-utensils" class="w-3.5 h-3.5" />
                </div>
              </NuxtLink>

              <!-- Secondary White Button -->
              <NuxtLink 
                to="/chats" 
                class="w-full sm:w-auto justify-center inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/95 hover:bg-white text-smak-neutral-900 font-extrabold text-sm sm:text-base shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <span>ШІ-Помічник</span>
                <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-coral-500" />
              </NuxtLink>
            </div>

          </div>
        </div>

      </div>
    </section>

    <!-- ===== 2. QUICK HIGHLIGHTS (2x2 GRID ON MOBILE, 4-CARDS GRID ON DESKTOP) ===== -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        
        <!-- Card 1: Cooking Community -->
        <div class="bg-smak-neutral-100/80 dark:bg-smak-neutral-900/60 p-4 sm:p-5 lg:p-6 rounded-2xl border border-smak-neutral-200/60 dark:border-smak-neutral-800/60 flex flex-col justify-between space-y-2.5 sm:space-y-3 hover:border-coral-500/40 transition-all group">
          <div class="space-y-2 sm:space-y-2.5">
            <div class="w-8 h-8 rounded-full bg-white dark:bg-smak-neutral-800 text-smak-neutral-700 dark:text-smak-neutral-200 flex items-center justify-center shadow-xs">
              <UIcon name="i-lucide-users" class="w-4 h-4 text-coral-500" />
            </div>
            <h3 class="font-heading font-extrabold text-sm sm:text-base text-smak-neutral-900 dark:text-white leading-snug">
              Кулінарна спільнота
            </h3>
            <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed line-clamp-3 sm:line-clamp-none">
              Діліться досвідом з іншими кулінарами, обговорюйте рецепти, ставте оцінки та знаходьте натхнення.
            </p>
          </div>
        </div>

        <!-- Card 2: AI Assistant -->
        <div class="bg-smak-neutral-100/80 dark:bg-smak-neutral-900/60 p-4 sm:p-5 lg:p-6 rounded-2xl border border-smak-neutral-200/60 dark:border-smak-neutral-800/60 flex flex-col justify-between space-y-2.5 sm:space-y-3 hover:border-coral-500/40 transition-all group">
          <div class="space-y-2 sm:space-y-2.5">
            <div class="w-8 h-8 rounded-full bg-white dark:bg-smak-neutral-800 text-smak-neutral-700 dark:text-smak-neutral-200 flex items-center justify-center shadow-xs">
              <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-coral-500" />
            </div>
            <h3 class="font-heading font-extrabold text-sm sm:text-base text-smak-neutral-900 dark:text-white leading-snug">
              Розумний ШІ-кулінар
            </h3>
            <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed line-clamp-3 sm:line-clamp-none">
              Підбирає рецепти за наявними інгредієнтами, перераховує порції та миттєво підказує заміни.
            </p>
          </div>
        </div>

        <!-- Card 3: Personal Menu & Diets -->
        <div class="bg-smak-neutral-100/80 dark:bg-smak-neutral-900/60 p-4 sm:p-5 lg:p-6 rounded-2xl border border-smak-neutral-200/60 dark:border-smak-neutral-800/60 flex flex-col justify-between space-y-2.5 sm:space-y-3 hover:border-coral-500/40 transition-all group">
          <div class="space-y-2 sm:space-y-2.5">
            <div class="w-8 h-8 rounded-full bg-white dark:bg-smak-neutral-800 text-smak-neutral-700 dark:text-smak-neutral-200 flex items-center justify-center shadow-xs">
              <UIcon name="i-lucide-heart" class="w-4 h-4 text-coral-500" />
            </div>
            <h3 class="font-heading font-extrabold text-sm sm:text-base text-smak-neutral-900 dark:text-white leading-snug">
              Персональне меню
            </h3>
            <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed line-clamp-3 sm:line-clamp-none">
              Легко налаштовуйте страви під свій стиль харчування, дієтичні вподобання та уникайте алергенів.
            </p>
          </div>
        </div>

        <!-- Card 4: Collections & Authors -->
        <div class="bg-smak-neutral-100/80 dark:bg-smak-neutral-900/60 p-4 sm:p-5 lg:p-6 rounded-2xl border border-smak-neutral-200/60 dark:border-smak-neutral-800/60 flex flex-col justify-between space-y-2.5 sm:space-y-3 hover:border-coral-500/40 transition-all group">
          <div class="space-y-2 sm:space-y-2.5">
            <div class="w-8 h-8 rounded-full bg-white dark:bg-smak-neutral-800 text-smak-neutral-700 dark:text-smak-neutral-200 flex items-center justify-center shadow-xs">
              <UIcon name="i-lucide-bookmark" class="w-4 h-4 text-coral-500" />
            </div>
            <h3 class="font-heading font-extrabold text-sm sm:text-base text-smak-neutral-900 dark:text-white leading-snug">
              Власні колекції
            </h3>
            <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed line-clamp-3 sm:line-clamp-none">
              Зберігайте улюблені рецепти у власні кулінарні добірки та публікуйте авторські страви.
            </p>
          </div>
        </div>

      </div>
    </section>

    <!-- ===== 3. RECIPE SHOWCASE TITLE & GRID ===== -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      <!-- Centered Heading in Ukrainian -->
      <div class="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-8 sm:mb-10">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
          Станьте справжнім <span class="text-coral-500">шефом</span> з нашими рецептами
        </h2>
        <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-2xl mx-auto">
          Переглядайте перевірені авторські рецепти спільноти SMAK або створюйте свої власні.
        </p>
      </div>

      <!-- Recipe Cards Grid -->
      <RecipeGridSkeleton v-if="loading" :count="3" />
      
      <!-- Empty DB State -->
      <div
        v-else-if="recipes.length === 0"
        class="rounded-3xl border border-dashed border-coral-300 dark:border-coral-800/80 bg-coral-50/50 dark:bg-coral-950/20 p-6 sm:p-8 text-center space-y-4"
      >
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-coral-500/15 text-coral-600 dark:text-coral-400 flex items-center justify-center mx-auto">
          <UIcon name="i-lucide-chef-hat" class="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h3 class="font-heading font-extrabold text-lg sm:text-xl text-smak-neutral-900 dark:text-white">
          Рецепти очікують на перших авторів!
        </h3>
        <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-md mx-auto">
          Будьте першим, хто опублікує власний рецепт у спільноті SMAK.
        </p>
        <UButton
          :to="user ? '/recipes/create' : '/auth/register'"
          size="lg"
          class="rounded-full font-bold px-7 py-3 bg-coral-500 hover:bg-coral-600 text-white shadow-md shadow-coral-500/25 cursor-pointer border-0 w-full sm:w-auto justify-center text-sm sm:text-base"
        >
          Додати рецепт
        </UButton>
      </div>

      <!-- Real Recipes Grid (1-column on mobile with large images, 2-col on sm, 3-col on lg) -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
        <RecipeCard
          v-for="recipe in recipes.slice(0, 6)"
          :key="recipe.id"
          :recipe="recipe"
          class="hover:scale-[1.02] transition-transform duration-300"
        />
      </div>

      <div class="mt-8 sm:mt-12 text-center">
        <NuxtLink
          to="/recipes"
          class="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base border border-smak-neutral-300 dark:border-smak-neutral-700 hover:border-coral-500 text-smak-neutral-900 dark:text-white hover:text-coral-500 transition-all cursor-pointer shadow-xs"
        >
          <span>Переглянути всі рецепти</span>
          <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
    </section>

    <!-- ===== 3.5 COOKING COMMUNITY BANNER (FULL WIDTH ON MOBILE, ADAPTIVE STACK) ===== -->
    <section class="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-10">
      <div class="relative rounded-none sm:rounded-4xl overflow-hidden shadow-2xl min-h-85 sm:min-h-95 md:min-h-105 flex flex-col items-center justify-between sm:justify-center p-6 sm:p-12 text-center">
        <!-- Background Image -->
        <img 
          src="/images/cooking_banner_bg.png" 
          alt="Давайте готувати смачно!" 
          class="absolute inset-0 w-full h-full object-cover object-center" 
        />
        <!-- Dark Overlay Gradient for maximum contrast -->
        <div class="absolute inset-0 bg-linear-to-t from-black/85 via-black/55 to-black/60 sm:bg-linear-to-r sm:from-black/60 sm:via-black/40 sm:to-black/55 backdrop-brightness-95"></div>

        <!-- Desktop Top-Right Community Badge (Hidden on mobile to give space for bold headline & moved to bottom button) -->
        <div class="hidden sm:flex absolute top-6 right-6 bg-white/95 dark:bg-smak-neutral-900/95 backdrop-blur-md px-5 py-3.5 rounded-3xl shadow-xl border border-white/40 dark:border-smak-neutral-800 items-center gap-4 z-20">
          <div class="space-y-0.5 text-left">
            <h4 class="font-heading font-extrabold text-sm sm:text-base text-smak-neutral-900 dark:text-white leading-tight">
              Приєднуйтесь до спільноти
            </h4>
            <p class="text-xs sm:text-sm font-semibold text-smak-neutral-500 dark:text-smak-neutral-400">
              1 000+ учасників
            </p>
          </div>
          
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Overlapping Avatars -->
            <div class="flex -space-x-2 overflow-hidden">
              <UAvatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Учасник" size="xs" class="ring-2 ring-white dark:ring-smak-neutral-900" />
              <UAvatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Учасник" size="xs" class="ring-2 ring-white dark:ring-smak-neutral-900" />
              <UAvatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Учасник" size="xs" class="ring-2 ring-white dark:ring-smak-neutral-900" />
            </div>
            <!-- Red Plus Icon Button -->
            <NuxtLink 
              to="/auth/register" 
              class="w-8 h-8 rounded-full bg-coral-500 hover:bg-coral-600 text-white flex items-center justify-center shadow-md transition-all duration-200 hover:scale-105 shrink-0 ml-1 cursor-pointer"
              title="Приєднатися"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>

        <!-- Mobile-only compact pill badge pinned to top-left (slightly larger) -->
        <div class="sm:hidden absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/55 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-semibold shadow-lg">
          <div class="flex -space-x-1.5 overflow-hidden">
            <UAvatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80" alt="Учасник" size="2xs" class="ring-1 ring-white" />
            <UAvatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80" alt="Учасник" size="2xs" class="ring-1 ring-white" />
            <UAvatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&q=80" alt="Учасник" size="2xs" class="ring-1 ring-white" />
          </div>
          <span>1 000+ у спільноті</span>
        </div>

        <!-- Mobile CTA: Pinned to top-right, matching chip size and height -->
        <div class="sm:hidden absolute top-4 right-4 z-20">
          <NuxtLink 
            to="/auth/register" 
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-smak-neutral-100 text-smak-neutral-900 font-extrabold text-xs sm:text-sm shadow-xl transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <span>Приєднатися</span>
            <div class="w-4.5 h-4.5 rounded-full bg-coral-500 text-white flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-plus" class="w-3 h-3" />
            </div>
          </NuxtLink>
        </div>

        <!-- Center Headline (Larger and prominent on mobile) -->
        <div class="relative z-10 text-center max-w-2xl px-2 my-auto py-3 sm:py-0">
          <h2 class="text-4xl sm:text-5xl lg:text-6xl font-black font-heading text-white tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)] leading-[1.1]">
            Давайте готувати <br />
            <span class="text-coral-500 font-black drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">смачно!</span>
          </h2>
        </div>

        <!-- Desktop Bottom-Right Action Button -->
        <div class="hidden sm:block absolute bottom-6 right-6 z-20">
          <NuxtLink 
            to="/recipes" 
            class="inline-flex w-auto justify-center items-center gap-3 px-6 py-3.5 rounded-full bg-smak-neutral-950/90 hover:bg-black text-white font-extrabold text-sm sm:text-base border border-white/20 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <span>Дослідити рецепти</span>
            <div class="w-7 h-7 rounded-full bg-white text-smak-neutral-950 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-chef-hat" class="w-3.5 h-3.5" />
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ===== 4. FAQ SECTION (TOUCH-OPTIMIZED ACCORDION) ===== -->
    <section class="py-6 sm:py-12 bg-white dark:bg-smak-neutral-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div class="space-y-1">
            <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-smak-neutral-900 dark:text-white">
              Поширені запитання
            </h2>
          </div>
          <!-- Desktop FAQ Button -->
          <NuxtLink
            to="/auth/register"
            class="hidden sm:inline-flex items-center justify-center gap-2 h-10.5 px-5 rounded-full font-bold text-sm sm:text-base border border-smak-neutral-200 dark:border-smak-neutral-800 bg-transparent hover:border-coral-500 text-smak-neutral-800 dark:text-smak-neutral-200 hover:text-coral-500 transition-all cursor-pointer shrink-0"
          >
            <span>Є питання? Пишіть нам</span>
          </NuxtLink>
        </div>

        <div class="divide-y divide-smak-neutral-200 dark:divide-smak-neutral-800">
          <div v-for="(faq, idx) in faqs" :key="idx">
            <button
              @click="toggleFaq(idx)"
              class="w-full flex items-center justify-between gap-4 py-4 sm:py-4.5 min-h-13 text-left group cursor-pointer"
            >
              <span class="font-semibold text-sm sm:text-base text-smak-neutral-900 dark:text-white group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors duration-200">
                {{ faq.q }}
              </span>
              <UIcon
                :name="openFaq === idx ? 'i-lucide-minus' : 'i-lucide-plus'"
                class="w-5 h-5 text-smak-neutral-400 dark:text-smak-neutral-500 shrink-0 transition-transform duration-200"
              />
            </button>
            <div
              class="overflow-hidden transition-all duration-300 ease-in-out"
              :class="openFaq === idx ? 'max-h-48 pb-4' : 'max-h-0'"
            >
              <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">{{ faq.a }}</p>
            </div>
          </div>
        </div>

        <!-- Mobile FAQ Button (Placed underneath the accordion) -->
        <div class="mt-6 sm:hidden">
          <NuxtLink
            to="/auth/register"
            class="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full font-bold text-sm border border-smak-neutral-200 dark:border-smak-neutral-800 bg-transparent hover:border-coral-500 text-smak-neutral-800 dark:text-smak-neutral-200 hover:text-coral-500 transition-all cursor-pointer shadow-xs"
          >
            <span>Є питання? Пишіть нам</span>
          </NuxtLink>
        </div>
      </div>
    </section>

  </div>
</template>
