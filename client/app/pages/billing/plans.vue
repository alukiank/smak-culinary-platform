<!--
@page-docs
title: Plans and subscriptions
description: Page for selecting a tariff plan for users of the SMAK platform. Allows the user to compare the features of FREE, PRO and PREMIUM plans, purchase a paid plan through LiqPay and manage the current subscription.
features:
  - Plan comparison: FREE (1 collection, 10 AI queries/day), PRO (10 collections, 50 AI queries/day, allergen filter, no ads) and PREMIUM (unlimited collections and AI queries, priority support).
  - Subscription payment: secure payment of PRO or PREMIUM tariff by card through integration with LiqPay payment system (redirect to LiqPay).
  - Subscription management: view status of active subscription (next billing date), save paid features until the end of the period when cancelled and ability to cancel subscription through confirmation modal window.
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBilling, PLAN_CONFIGS } from '~/composables/useBilling'
import type { PlanType } from '~/types/billing'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ fullWidth: true })

useSeoMeta({
  title: 'Smak | Тарифи та підписки',
  description: 'Оберіть свій кулінарний тариф. Отримайте безлімітний доступ до ШІ-помічника, розширені фільтри алергенів та персоналізовані колекції.'
})

const { user } = useAuth()
const {
  activeSubscription,
  activePlan,
  currentPlanConfig,
  fetchSubscription,
  createCheckout,
  cancelActiveSubscription,
  triggerUpgradeModal
} = useBilling()

const isLoadingPay = ref<Record<string, boolean>>({})
const isConfirmCancelOpen = ref(false)
const isCancelling = ref(false)
const mobileActivePlan = ref<'FREE' | 'PRO' | 'PREMIUM'>('FREE')
const cardsContainerRef = ref<HTMLElement | null>(null)

const scrollToPlan = (plan: 'FREE' | 'PRO' | 'PREMIUM') => {
  mobileActivePlan.value = plan
  const el = document.getElementById(`plan-card-mobile-${plan}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}

const handleCarouselScroll = () => {
  if (!cardsContainerRef.value) return
  const container = cardsContainerRef.value
  const scrollPosition = container.scrollLeft + container.clientWidth / 2

  const plans: Array<'FREE' | 'PRO' | 'PREMIUM'> = ['FREE', 'PRO', 'PREMIUM']
  for (const plan of plans) {
    const el = document.getElementById(`plan-card-mobile-${plan}`)
    if (el) {
      const left = el.offsetLeft
      const right = left + el.offsetWidth
      if (scrollPosition >= left && scrollPosition <= right) {
        mobileActivePlan.value = plan
        break
      }
    }
  }
}

onMounted(async () => {
  const route = useRoute()
  const router = useRouter()

  if (route.query.payment === 'success') {
    const toast = useToast()
    toast.add({
      title: 'Оплата прийнята!',
      description: 'Оновлюємо статус вашої підписки...',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    // Remove ?payment=success from URL cleanly to avoid re-triggering toast on F5
    router.replace({ query: { ...route.query, payment: undefined } })

    if (user.value) {
      let attempts = 0
      const checkSub = async () => {
        await fetchSubscription()
        attempts++
        if (activePlan.value === 'FREE' && attempts < 4) {
          setTimeout(checkSub, 1500)
        }
      }
      await checkSub()
    }
  } else if (user.value) {
    await fetchSubscription()
  }

  if (activePlan.value && ['FREE', 'PRO', 'PREMIUM'].includes(activePlan.value)) {
    scrollToPlan(activePlan.value as 'FREE' | 'PRO' | 'PREMIUM')
  } else {
    mobileActivePlan.value = 'FREE'
  }
})

const handleSubscribe = async (planType: PlanType) => {
  if (!user.value) {
    navigateTo('/auth/login')
    return
  }

  if (!user.value.isVerified) {
    const toast = useToast()
    toast.add({
      title: 'Підтвердіть електронну пошту',
      description: 'Для придбання підписки необхідно підтвердити пошту.',
      color: 'warning',
      icon: 'i-lucide-mail-warning',
    })
    return
  }

  isLoadingPay.value[planType] = true
  try {
    const res = await createCheckout(planType)
    if (res?.checkoutUrl) {
      // Redirect to LiqPay secure payment gateway
      window.location.href = res.checkoutUrl
    }
  } catch (err) {
    console.error('Failed to checkout', err)
  } finally {
    isLoadingPay.value[planType] = false
  }
}

const handleCancelSubscription = async () => {
  isCancelling.value = true
  try {
    await cancelActiveSubscription()
    isConfirmCancelOpen.value = false
  } catch (e) {
    console.error('Failed to cancel subscription', e)
  } finally {
    isCancelling.value = false
  }
}

// Visual helpers
const formatPrice = (price: number) => {
  return price === 0 ? 'Безкоштовно' : `${price} UAH`
}

const formatDate = (isoString: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const openFaq = ref<number | null>(null)

const toggleFaq = (idx: number) => {
  openFaq.value = openFaq.value === idx ? null : idx
}

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
  <div class="overflow-x-hidden bg-white dark:bg-smak-neutral-950 transition-colors duration-500 pt-8 sm:pt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-8 mb-8 sm:mb-12">
      <!-- Header Block -->
      <div class="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2">
        <h1 class="text-3xl sm:text-4xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
          Оберіть свій рівень <br />
          <span class="bg-brand-gradient bg-clip-text text-transparent" style="-webkit-background-clip: text; background-clip: text;">кулінарної свободи</span>
        </h1>
        <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
          Оплата працює у тестовому режимі: реальні кошти не списуються. Для перевірки тарифів використовуйте тестову картку.
        </p>
      </div>

      <!-- Mobile Plan Selector Tabs (Full Width Outline Pills) -->
      <div class="grid grid-cols-3 gap-2.5 w-full md:hidden my-1">
        <button
          type="button"
          class="flex items-center justify-center py-2.5 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-transparent"
          :class="mobileActivePlan === 'FREE' 
            ? 'border-coral-500! text-coral-500! font-bold' 
            : 'border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-400 hover:border-coral-300'"
          @click="scrollToPlan('FREE')"
        >
          Free
        </button>
        <button
          type="button"
          class="flex items-center justify-center gap-1 py-2.5 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-transparent"
          :class="mobileActivePlan === 'PRO' 
            ? 'border-coral-500! text-coral-500! font-bold' 
            : 'border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-400 hover:border-coral-300'"
          @click="scrollToPlan('PRO')"
        >
          <span>Pro</span>
          <span class="text-[10px]">🔥</span>
        </button>
        <button
          type="button"
          class="flex items-center justify-center gap-1 py-2.5 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-transparent"
          :class="mobileActivePlan === 'PREMIUM' 
            ? 'border-indigo-500! text-indigo-500! font-bold' 
            : 'border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-400 hover:border-indigo-300'"
          @click="scrollToPlan('PREMIUM')"
        >
          <span>Premium</span>
          <span class="text-[10px]">👑</span>
        </button>
      </div>

      <!-- Pricing Cards Container (Snap carousel on mobile, 3-col grid on desktop) -->
      <div 
        ref="cardsContainerRef"
        @scroll.passive="handleCarouselScroll"
        class="flex md:grid md:grid-cols-3 gap-6 items-stretch overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-4 pt-5 md:pt-4 custom-scrollbar -mx-4 px-4 md:mx-0"
      >
        
        <!-- Card: FREE -->
        <div 
          id="plan-card-mobile-FREE"
          class="snap-center shrink-0 w-[85vw] sm:w-87.5 md:w-auto relative flex flex-col justify-between rounded-2xl sm:rounded-3xl p-5 sm:p-6 border bg-white/60 dark:bg-smak-neutral-900/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-lg"
          :class="activePlan === 'FREE' 
            ? 'border-coral-500 dark:border-coral-500/80 ring-2 ring-coral-400/20' 
            : 'border-smak-neutral-200 dark:border-smak-neutral-800'"
        >
          <!-- Active Badge -->
          <span v-if="activePlan === 'FREE'" class="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-coral-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
            Ваш тариф
          </span>

          <div class="space-y-4">
            <!-- Card Header -->
            <div class="space-y-1.5">
              <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white">
                {{ PLAN_CONFIGS.FREE.name }}
              </h3>
              <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                {{ PLAN_CONFIGS.FREE.description }}
              </p>
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-1">
              <span class="text-2xl sm:text-3xl font-display font-black text-smak-neutral-900 dark:text-white">
                {{ formatPrice(PLAN_CONFIGS.FREE.price) }}
              </span>
              <span v-if="PLAN_CONFIGS.FREE.price > 0" class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 font-bold">/ міс.</span>
            </div>

            <div class="h-px bg-smak-neutral-200/60 dark:bg-smak-neutral-800"></div>

            <!-- Features List -->
            <ul class="space-y-3 text-xs sm:text-sm font-medium">
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-coral-500 shrink-0 mt-0.5" />
                <span>До <strong>1 колекції</strong> рецептів</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-coral-500 shrink-0 mt-0.5" />
                <span>До <strong>10 ШІ-запитів</strong> на день</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-400 dark:text-smak-neutral-500 line-through">
                <UIcon name="i-lucide-lock" class="w-4 h-4 opacity-60 shrink-0 mt-0.5" />
                <span>Фільтри алергенів та дієт</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-400 dark:text-smak-neutral-500 line-through">
                <UIcon name="i-lucide-lock" class="w-4 h-4 opacity-60 shrink-0 mt-0.5" />
                <span>Пріоритетна обробка страв</span>
              </li>
            </ul>
          </div>

          <!-- Button -->
          <div class="mt-6 pt-2">
            <UButton 
              disabled
              block
              size="md"
              variant="outline"
              color="neutral"
              class="rounded-full font-bold py-2.5 text-xs sm:text-sm"
              :label="activePlan === 'FREE' ? 'Ваш поточний план' : 'Базовий'"
            />
          </div>
        </div>

        <!-- Card: PRO -->
        <div 
          id="plan-card-mobile-PRO"
          class="snap-center shrink-0 w-[85vw] sm:w-87.5 md:w-auto relative flex flex-col justify-between rounded-2xl sm:rounded-3xl p-5 sm:p-6 border bg-white/95 dark:bg-smak-neutral-900/80 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] shadow-md hover:shadow-xl"
          :class="activePlan === 'PRO' 
            ? 'border-coral-500 dark:border-coral-500/80 ring-2 ring-coral-400/20' 
            : 'border-orange-200 dark:border-orange-950/30'"
        >
          <span v-if="activePlan === 'PRO'" class="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-coral-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
            Ваш тариф
          </span>

          <div class="space-y-4">
            <!-- Card Header -->
            <div class="space-y-1.5">
              <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white flex items-center gap-1.5">
                {{ PLAN_CONFIGS.PRO.name }}
                <UIcon name="i-lucide-award" class="w-4.5 h-4.5 text-orange-500" />
              </h3>
              <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                {{ PLAN_CONFIGS.PRO.description }}
              </p>
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-1">
              <span class="text-2xl sm:text-3xl font-display font-black bg-brand-gradient bg-clip-text text-transparent" style="-webkit-background-clip: text; background-clip: text;">
                {{ formatPrice(PLAN_CONFIGS.PRO.price) }}
              </span>
              <span class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 font-bold">/ міс.</span>
            </div>

            <div class="h-px bg-smak-neutral-200/60 dark:bg-smak-neutral-800"></div>

            <!-- Features List -->
            <ul class="space-y-3 text-xs sm:text-sm font-medium">
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <span>До <strong>10 колекцій</strong> рецептів</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <span>До <strong>50 ШІ-запитів</strong> на день</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <span>Фільтри алергенів та дієт</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <span>Пріоритетна обробка страв</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <span>Відсутність реклами</span>
              </li>
            </ul>
          </div>

          <!-- Button -->
          <div class="mt-6 pt-2">
            <UButton 
              v-if="activePlan === 'PRO'"
              disabled
              block
              size="md"
              variant="outline"
              color="neutral"
              class="rounded-full font-bold py-2.5 text-xs sm:text-sm"
              label="Ваш поточний план"
            />
            <UButton 
              v-else
              block
              size="md"
              class="rounded-full font-bold py-2.5 text-xs sm:text-sm bg-brand-gradient border-0 text-white shadow-md shadow-coral-500/20 hover:shadow-coral-500/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              :loading="isLoadingPay.PRO"
              @click="handleSubscribe('PRO')"
              :label="activePlan === 'PREMIUM' ? 'Знизити до Pro' : 'Придбати тариф Pro'"
            />
          </div>
        </div>

        <!-- Card: PREMIUM -->
        <div 
          id="plan-card-mobile-PREMIUM"
          class="snap-center shrink-0 w-[85vw] sm:w-87.5 md:w-auto relative flex flex-col justify-between rounded-2xl sm:rounded-3xl p-5 sm:p-6 border bg-white/60 dark:bg-smak-neutral-900/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-lg"
          :class="activePlan === 'PREMIUM' 
            ? 'border-indigo-500 dark:border-indigo-500/80 ring-2 ring-indigo-400/20' 
            : 'border-smak-neutral-200 dark:border-smak-neutral-800'"
        >
          <span v-if="activePlan === 'PREMIUM'" class="absolute -top-3 left-5 px-3 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
            Ваш тариф
          </span>

          <div class="space-y-4">
            <!-- Card Header -->
            <div class="space-y-1.5">
              <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white flex items-center gap-1.5">
                {{ PLAN_CONFIGS.PREMIUM.name }}
                <UIcon name="i-lucide-crown" class="w-4.5 h-4.5 text-indigo-500" />
              </h3>
              <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                {{ PLAN_CONFIGS.PREMIUM.description }}
              </p>
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-1">
              <span class="text-2xl sm:text-3xl font-display font-black text-indigo-600 dark:text-indigo-400">
                {{ formatPrice(PLAN_CONFIGS.PREMIUM.price) }}
              </span>
              <span class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 font-bold">/ міс.</span>
            </div>

            <div class="h-px bg-smak-neutral-200/60 dark:bg-smak-neutral-800"></div>

            <!-- Features List -->
            <ul class="space-y-3 text-xs sm:text-sm font-medium">
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>Необмежені колекції</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>Безлімітний ШІ-асистент</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>Фільтри алергенів та дієт</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>Пріоритетна підтримка 24/7</span>
              </li>
              <li class="flex items-start gap-2.5 text-smak-neutral-700 dark:text-smak-neutral-300">
                <UIcon name="i-lucide-check-circle" class="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>Ранній доступ до нових фіч</span>
              </li>
            </ul>
          </div>

          <!-- Button -->
          <div class="mt-6 pt-2">
            <UButton 
              v-if="activePlan === 'PREMIUM'"
              disabled
              block
              size="md"
              variant="outline"
              color="neutral"
              class="rounded-full font-bold py-2.5 text-xs sm:text-sm"
              label="Ваш поточний план"
            />
            <UButton 
              v-else
              block
              size="md"
              class="rounded-full font-bold py-2.5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              :loading="isLoadingPay.PREMIUM"
              @click="handleSubscribe('PREMIUM')"
              label="Придбати Premium"
            />
          </div>
        </div>

      </div>

      <!-- Active Subscription Management Info -->
      <div 
        v-if="activeSubscription && activePlan !== 'FREE'" 
        class="bg-white/80 dark:bg-smak-neutral-900 border border-smak-neutral-200 dark:border-smak-neutral-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
              {{ activeSubscription.status === 'ACTIVE' ? 'Активна підписка' : 'Скасована підписка' }}
            </span>
            <span class="text-sm font-bold text-smak-neutral-800 dark:text-white">
              Тариф: {{ activeSubscription.planType }}
            </span>
          </div>
          
          <p v-if="activeSubscription.status === 'ACTIVE'" class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed">
            Наступне автоматичне списання відбудеться: <strong>{{ formatDate(activeSubscription.currentPeriodEnd) }}</strong>.
          </p>
          <p v-else class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed">
            Доступ до платного плану збережено! Платні фічі будуть активні до: <strong>{{ formatDate(activeSubscription.currentPeriodEnd) }}</strong>.
          </p>
        </div>

        <div class="shrink-0" v-if="activeSubscription.status === 'ACTIVE'">
          <UButton 
            variant="ghost" 
            color="error" 
            class="rounded-full font-bold py-2 px-4 text-xs sm:text-sm hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
            label="Скасувати підписку"
            @click="() => { isConfirmCancelOpen = true }"
          />
        </div>
      </div>

      <!-- Subscription Cancellation Modal -->
      <UModal 
        v-model:open="isConfirmCancelOpen"
        :ui="{
          overlay: 'z-[100]',
          content: 'z-[100] sm:max-w-sm rounded-3xl border border-smak-neutral-200 dark:border-smak-neutral-800 bg-white dark:bg-smak-neutral-900 shadow-2xl p-5 sm:p-6 overflow-hidden'
        }"
      >
        <template #content>
          <div class="space-y-4 text-left">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-lg sm:text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
                Скасувати підписку?
              </h3>
              <button
                type="button"
                class="p-1 rounded-full text-smak-neutral-400 hover:text-smak-neutral-700 dark:hover:text-smak-neutral-200 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
                aria-label="Закрити"
                @click="() => { isConfirmCancelOpen = false }"
              >
                <UIcon name="i-lucide-x" class="w-4.5 h-4.5" />
              </button>
            </div>

            <p class="text-xs sm:text-sm text-smak-neutral-600 dark:text-smak-neutral-300 font-medium leading-relaxed">
              Ви втратите доступ до розширеного ШІ-асистента, персональних фільтрів алергенів та додаткових колекцій після завершення сплаченого періоду.
            </p>

            <div class="flex items-center justify-end gap-2.5 pt-2">
              <UButton 
                label="Залишити" 
                color="neutral" 
                variant="ghost" 
                class="rounded-full px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer bg-transparent hover:bg-transparent border border-transparent hover:border-smak-neutral-300 dark:hover:border-smak-neutral-700"
                @click="() => { isConfirmCancelOpen = false }" 
              />
              <UButton 
                label="Скасувати підписку" 
                color="error" 
                variant="solid"
                class="rounded-full px-5 py-2 text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all hover:scale-105 bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25"
                :loading="isCancelling"
                @click="handleCancelSubscription" 
              />
            </div>
          </div>
        </template>
      </UModal>

    </div>

    <!-- ===== FAQ ===== -->
    <section class="py-6 sm:py-12 bg-white dark:bg-smak-neutral-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-8">
          <div class="space-y-1">
            <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-smak-neutral-900 dark:text-white">
              Поширені запитання
            </h2>
          </div>
          <NuxtLink
            to="/auth/register"
            class="h-10.5 px-5 rounded-full font-bold text-sm sm:text-base border border-smak-neutral-200 dark:border-smak-neutral-800 bg-transparent hover:bg-transparent hover:border-coral-500 text-smak-neutral-800 dark:text-smak-neutral-200 hover:text-coral-500 transition-all cursor-pointer hidden sm:inline-flex items-center justify-center gap-2 shrink-0"
          >
            <span>Є питання? Пишіть нам</span>
          </NuxtLink>
        </div>

        <div class="divide-y divide-smak-neutral-200 dark:divide-smak-neutral-800">
          <div v-for="(faq, idx) in faqs" :key="idx">
            <button
              @click="toggleFaq(idx)"
              class="w-full flex items-center justify-between gap-4 py-3.5 sm:py-4 text-left group cursor-pointer"
            >
              <span class="font-semibold text-smak-neutral-900 dark:text-white group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors duration-200">
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
              <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">{{ faq.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.bg-brand-gradient {
  background-image: linear-gradient(135deg, #f05b5b 0%, #f37d32 50%, #f9a826 100%);
}
.transition-all {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
