import { computed } from 'vue'
import type { PlanType, Currency, PlanConfig, SubscriptionResponseDto } from '~/types/billing'



export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  FREE: {
    planType: 'FREE',
    name: 'Free',
    price: 0,
    currency: 'UAH',
    description: 'Базовий безкоштовний тариф',
    features: {
      maxCollections: 1,
      maxAiRequestsPerDay: 10,
      allowAllergiesAndDiets: false,
      descriptionFeatures: [
        'Перегляд та пошук рецептів',
        'Базовий ШІ-асистент',
        'Створення до 1 колекції рецептів'
      ]
    }
  },
  PRO: {
    planType: 'PRO',
    name: 'Pro',
    price: 149,
    currency: 'UAH',
    description: 'Розширений доступ для кулінарів',
    features: {
      maxCollections: 10,
      maxAiRequestsPerDay: 50,
      allowAllergiesAndDiets: true,
      descriptionFeatures: [
        'Необмежене збереження рецептів',
        'Повноцінний ШІ-асистент (до 50 запитів на добу)',
        'Вказівка алергій та дієт для розумних порад',
        'Пріоритетна обробка та генерація рецептів',
        'Створення до 10 колекцій рецептів'
      ]
    }
  },
  PREMIUM: {
    planType: 'PREMIUM',
    name: 'Premium',
    price: 299,
    currency: 'UAH',
    description: 'Максимальний безлімітний доступ',
    features: {
      maxCollections: Infinity,
      maxAiRequestsPerDay: Infinity,
      allowAllergiesAndDiets: true,
      descriptionFeatures: [
        'Всі можливості плану Pro',
        'Безлімітні запити до ШІ-асистента',
        'Необмежене створення колекцій рецептів',
        'Пріоритетна підтримка 24/7',
        'Ранній доступ до ексклюзивного контенту та нових фіч'
      ]
    }
  }
}

export const useBilling = () => {
  const { $api } = useNuxtApp()
  const toast = useToast()

  // SSR-safe Nuxt global states
  const activeSubscription = useState<SubscriptionResponseDto | null>('active-subscription', () => null)
  const isLoadingSub = useState<boolean>('isLoadingSub', () => false)
  const plansList = useState<PlanConfig[]>('plansList', () => [])
  const isLoadingPlans = useState<boolean>('isLoadingPlans', () => false)

  const isUpgradeModalOpen = useState<boolean>('isUpgradeModalOpen', () => false)
  const upgradeModalFeature = useState<'chat' | 'collections' | 'allergies'>('upgradeModalFeature', () => 'chat')

  // Computed state for active plan
  const activePlan = computed<PlanType>(() => {
    if (!activeSubscription.value) return 'FREE'

    const status = activeSubscription.value.status
    if (status === 'ACTIVE') {
      return activeSubscription.value.planType as PlanType
    }

    // CANCELED subscriptions remain active until currentPeriodEnd
    if (
      status === 'CANCELED' &&
      activeSubscription.value.currentPeriodEnd &&
      new Date(activeSubscription.value.currentPeriodEnd) > new Date()
    ) {
      return activeSubscription.value.planType as PlanType
    }

    return 'FREE'
  })

  const currentPlanConfig = computed<PlanConfig>(() => {
    return PLAN_CONFIGS[activePlan.value]
  })

  /**
   * Fetch current user subscription. Fallback to FREE on 404.
   */
  const fetchSubscription = async (): Promise<SubscriptionResponseDto | null> => {
    isLoadingSub.value = true
    try {
      const data = await $api<SubscriptionResponseDto>('/billing/subscription/me')
      activeSubscription.value = data
      return data
    } catch (err: any) {
      if (err.status === 404) {
        // User is automatically FREE if no entry exists
        activeSubscription.value = null
        return null
      }
      console.error('Error fetching subscription:', err)
      return null
    } finally {
      isLoadingSub.value = false
    }
  }

  /**
   * Fetch available subscription plans list from the backend
   */
  const fetchPlans = async (): Promise<PlanConfig[]> => {
    isLoadingPlans.value = true
    try {
      const data = await $api<PlanConfig[]>('/billing/plans')
      plansList.value = data
      return data
    } catch (err: any) {
      console.error('Error fetching plans:', err)
      // Fallback to static configs
      return Object.values(PLAN_CONFIGS)
    } finally {
      isLoadingPlans.value = false
    }
  }

  /**
   * Post checkout parameters for LiqPay Checkout
   */
  const createCheckout = async (planType: PlanType) => {
    const { user } = useAuth()
    if (user.value && !user.value.isVerified) {
      toast.add({
        title: 'Підтвердіть електронну пошту',
        description: 'Для придбання підписки необхідно підтвердити пошту.',
        color: 'warning',
        icon: 'i-lucide-mail-warning',
      })
      throw new Error('Email verification required')
    }

    try {
      const data = await $api<{ data: string; signature: string; checkoutUrl: string }>('/billing/checkout', {
        method: 'POST',
        body: { planType }
      })
      return data
    } catch (err: any) {
      console.error('Checkout error:', err)
      if (err.status === 403) {
        toast.add({
          title: 'Підтвердіть електронну пошту',
          description: 'Для придбання підписки необхідно підтвердити пошту.',
          color: 'warning',
          icon: 'i-lucide-mail-warning',
        })
      } else {
        toast.add({
          title: 'Помилка',
          description: err.data?.message || 'Не вдалося ініціювати оплату',
          color: 'error'
        })
      }
      throw err
    }
  }

  /**
   * Cancel subscription
   */
  const cancelActiveSubscription = async (): Promise<SubscriptionResponseDto> => {
    try {
      const data = await $api<SubscriptionResponseDto>('/billing/subscription/cancel', {
        method: 'POST'
      })
      activeSubscription.value = data
      toast.add({
        title: 'Успіх',
        description: 'Підписку скасовано. Вона діятиме до завершення розрахункового періоду.',
        color: 'success'
      })
      return data
    } catch (err: any) {
      console.error('Cancellation error:', err)
      toast.add({
        title: 'Помилка',
        description: err.data?.message || 'Не вдалося скасувати підписку',
        color: 'error'
      })
      throw err
    }
  }

  /**
   * Open the plan upgrade modal contextually
   */
  const triggerUpgradeModal = (feature: 'chat' | 'collections' | 'allergies' = 'chat') => {
    upgradeModalFeature.value = feature
    isUpgradeModalOpen.value = true
  }

  /**
   * Clear active subscription state (e.g. on logout)
   */
  const clearSubscription = () => {
    activeSubscription.value = null
  }

  return {
    // Shared states
    activeSubscription,
    activePlan,
    currentPlanConfig,
    plansList,
    isLoadingSub,
    isLoadingPlans,
    isUpgradeModalOpen,
    upgradeModalFeature,
    // Actions
    fetchSubscription,
    fetchPlans,
    createCheckout,
    cancelActiveSubscription,
    triggerUpgradeModal,
    clearSubscription
  }
}
