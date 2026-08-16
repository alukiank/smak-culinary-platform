import type { SubscriptionResponseDto, PaymentResponseDto } from '~/types/billing'

export interface PaginationMeta {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export function useAdminBilling() {
  const subscriptions = useState<SubscriptionResponseDto[]>('admin-billing-subscriptions', () => [])
  const subscriptionsMeta = useState<PaginationMeta | null>('admin-billing-subscriptions-meta', () => null)
  
  const payments = useState<PaymentResponseDto[]>('admin-billing-payments', () => [])
  const paymentsMeta = useState<PaginationMeta | null>('admin-billing-payments-meta', () => null)
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSubscriptions = async (params: { page?: number, limit?: number, userId?: string, planType?: string, status?: string } = {}) => {
    loading.value = true
    error.value = null
    try {
      const { $api } = useNuxtApp()
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.userId) queryParams.append('userId', params.userId)
      if (params.planType && params.planType !== 'all') queryParams.append('planType', params.planType)
      if (params.status && params.status !== 'all') queryParams.append('status', params.status)

      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : ''
      const res = await $api<PaginatedResponse<SubscriptionResponseDto>>(`/admin/billing/subscriptions${queryStr}`, {
        method: 'GET'
      })
      subscriptions.value = res.data
      subscriptionsMeta.value = res.meta
    } catch (err: any) {
      error.value = err.data?.message || 'Не вдалося завантажити підписки'
    } finally {
      loading.value = false
    }
  }

  const fetchPayments = async (params: { page?: number, limit?: number, userId?: string, status?: string } = {}) => {
    loading.value = true
    error.value = null
    try {
      const { $api } = useNuxtApp()
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.userId) queryParams.append('userId', params.userId)
      if (params.status && params.status !== 'all') queryParams.append('status', params.status)

      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : ''
      const res = await $api<PaginatedResponse<PaymentResponseDto>>(`/admin/billing/payments${queryStr}`, {
        method: 'GET'
      })
      payments.value = res.data
      paymentsMeta.value = res.meta
    } catch (err: any) {
      error.value = err.data?.message || 'Не вдалося завантажити платежі'
    } finally {
      loading.value = false
    }
  }

  const updateSubscriptionStatus = async (id: string, data: { planType?: string, status?: string, currentPeriodEnd?: string }) => {
    loading.value = true
    error.value = null
    try {
      const { $api } = useNuxtApp()
      const updated = await $api<SubscriptionResponseDto>(`/admin/billing/subscriptions/${id}`, {
        method: 'PATCH',
        body: data
      })
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = updated
      }
      return updated
    } catch (err: any) {
      error.value = err.data?.message || 'Не вдалося оновити підписку'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    subscriptions,
    subscriptionsMeta,
    payments,
    paymentsMeta,
    loading,
    error,
    fetchSubscriptions,
    fetchPayments,
    updateSubscriptionStatus
  }
}
