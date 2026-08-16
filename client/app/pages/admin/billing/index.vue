<!--
@page-docs
title: Billing Panel (Admin)
description: Admin panel section for managing user subscriptions and tracking payments on the SMAK platform.
features:
  - View list of all user subscriptions (active, past due, expired, canceled).
  - Search/filter subscriptions by user, plan type, and status.
  - Manually edit user subscriptions (change plan type, update status, set expiration date).
  - View payment transactions history (amount, status, date).
  - Paginated navigation and refresh functionality for financial data.
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | Billing Panel (Admin)'
})
import { ref, onMounted, watch } from 'vue'
import { useAdminBilling } from '~/composables/useAdminBilling'
import { formatDate, translateSubscriptionStatus, translatePaymentStatus } from '~/utils/formatters'
import AppPagination from '~/components/shared/AppPagination.vue'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin'
})

const { subscriptions, subscriptionsMeta, payments, paymentsMeta, loading, error, fetchSubscriptions, fetchPayments, updateSubscriptionStatus } = useAdminBilling()

const route = useRoute()
const router = useRouter()

const userId = ref((route.query.userId as string) || '')
const userName = ref((route.query.userName as string) || '')

const items = [
  { label: 'Підписки', value: 'subscriptions', icon: 'i-lucide-credit-card' },
  { label: 'Платежі', value: 'payments', icon: 'i-lucide-receipt' }
]

const selectedTab = ref('subscriptions')

const subscriptionColumns = [
  { accessorKey: 'user', header: 'Користувач', meta: { class: { th: 'w-48 min-w-[12rem]', td: 'w-48 min-w-[12rem]' } } },
  { accessorKey: 'planType', header: 'План', meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } } },
  { accessorKey: 'status', header: 'Статус', meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } } },
  { accessorKey: 'currentPeriodEnd', header: 'Діє до', meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } } },
  { accessorKey: 'actions', header: 'Дії', meta: { class: { th: 'w-24 min-w-[6rem]', td: 'w-24 min-w-[6rem]' } } }
]

const paymentColumns = [
  { accessorKey: 'user', header: 'Користувач', meta: { class: { th: 'w-48 min-w-[12rem]', td: 'w-48 min-w-[12rem]' } } },
  { accessorKey: 'amount', header: 'Сума', meta: { class: { th: 'w-24 min-w-[6rem]', td: 'w-24 min-w-[6rem]' } } },
  { accessorKey: 'status', header: 'Статус', meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } } },
  { accessorKey: 'createdAt', header: 'Дата', meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } } }
]

const subPage = ref(1)
const subLimit = ref(10)
const subPlanType = ref('all')
const subStatus = ref('all')

const payPage = ref(1)
const payLimit = ref(10)
const payStatus = ref('all')

const loadData = () => {
  if (selectedTab.value === 'subscriptions') {
    fetchSubscriptions({
      page: subPage.value,
      limit: subLimit.value,
      userId: userId.value || undefined,
      planType: subPlanType.value,
      status: subStatus.value
    })
  } else {
    fetchPayments({
      page: payPage.value,
      limit: payLimit.value,
      userId: userId.value || undefined,
      status: payStatus.value
    })
  }
}

onMounted(() => {
  loadData()
})

watch(selectedTab, () => {
  loadData()
})

watch([subPage, subLimit, subPlanType, subStatus], () => {
  if (selectedTab.value === 'subscriptions') loadData()
})

watch([payPage, payLimit, payStatus], () => {
  if (selectedTab.value === 'payments') loadData()
})

watch(() => route.query.userId, (newUserId) => {
  userId.value = (newUserId as string) || ''
  userName.value = (route.query.userName as string) || ''
  subPage.value = 1
  payPage.value = 1
  loadData()
})

const clearUserFilter = () => {
  userId.value = ''
  userName.value = ''
  router.push({ query: { ...route.query, userId: undefined, userName: undefined } })
  loadData()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'PAST_DUE': return 'warning'
    case 'EXPIRED': return 'neutral'
    case 'CANCELED': return 'error'
    case 'SUCCESS': return 'success'
    case 'PENDING': return 'warning'
    case 'FAILURE':
    case 'ERROR': return 'error'
    case 'REVERSED': return 'neutral'
    default: return 'neutral'
  }
}

const isStatusModalOpen = ref(false)
const selectedSubForStatus = ref<any>(null)
const newPlanType = ref('')
const newStatus = ref('')
const newPeriodEnd = ref('')

const planOptions = [
  { label: 'FREE', value: 'FREE' },
  { label: 'PRO', value: 'PRO' },
  { label: 'PREMIUM', value: 'PREMIUM' }
]

const statusOptions = [
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'PAST_DUE', value: 'PAST_DUE' },
  { label: 'EXPIRED', value: 'EXPIRED' },
  { label: 'CANCELED', value: 'CANCELED' }
]

const openEditModal = (row: any) => {
  selectedSubForStatus.value = row
  newPlanType.value = row.planType
  newStatus.value = row.status
  newPeriodEnd.value = row.currentPeriodEnd ? row.currentPeriodEnd.split('T')[0] : ''
  setTimeout(() => {
    isStatusModalOpen.value = true
  }, 50)
}

const applyStatusChange = async () => {
  if (selectedSubForStatus.value) {
    await updateSubscriptionStatus(selectedSubForStatus.value.id, {
      planType: newPlanType.value || undefined,
      status: newStatus.value || undefined,
      currentPeriodEnd: newPeriodEnd.value ? new Date(newPeriodEnd.value).toISOString() : undefined
    })
    isStatusModalOpen.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Підписки та Платежі</h1>
      <UButton icon="i-lucide-refresh-cw" color="neutral" @click="loadData" :loading="loading">
        Оновити
      </UButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-4">
      <!-- Active User Filter Badge -->
      <UBadge 
        v-if="userId" 
        color="primary" 
        variant="subtle" 
        size="md"
        class="rounded-xl font-bold flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 animate-fade-in"
      >
        <span>Користувач: {{ userName || userId }}</span>
        <UButton 
          icon="i-lucide-x" 
          color="primary" 
          variant="ghost" 
          size="xs" 
          class="rounded-full h-5 w-5 p-0 hover:bg-primary-100 dark:hover:bg-primary-950/40 cursor-pointer"
          @click="clearUserFilter"
        />
      </UBadge>
    </div>

    <UAlert v-if="error" color="error" icon="i-lucide-alert-triangle" :title="error" class="mb-6" />
    
    <!-- Main Navigation Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-800 gap-4 mb-6">
      <button 
        v-for="tab in items" 
        :key="tab.value" 
        @click="selectedTab = tab.value"
        class="flex items-center gap-2 pb-3 px-2 font-heading font-bold text-sm border-b-2 transition-smooth cursor-pointer"
        :class="[
          selectedTab === tab.value 
            ? 'border-coral-500 text-coral-500' 
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        ]"
      >
        <UIcon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div v-if="selectedTab === 'subscriptions'" class="space-y-4">
      <!-- Subscription Filters -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
        <USelect 
          v-model="subPlanType" 
          :items="[
            { label: 'Усі плани', value: 'all' },
            { label: 'FREE', value: 'FREE' },
            { label: 'PRO', value: 'PRO' },
            { label: 'PREMIUM', value: 'PREMIUM' }
          ]" 
          class="w-full"
        />
        
        <USelect 
          v-model="subStatus" 
          :items="[
            { label: 'Усі статуси', value: 'all' },
            { label: 'ACTIVE - Активна', value: 'ACTIVE' },
            { label: 'PAST_DUE - Прострочена', value: 'PAST_DUE' },
            { label: 'EXPIRED - Закінчилася', value: 'EXPIRED' },
            { label: 'CANCELED - Скасована', value: 'CANCELED' }
          ]" 
          class="w-full"
        />

        <div class="flex items-center justify-end gap-2 text-sm text-gray-500 font-medium">
          <span>На сторінці:</span>
          <USelect v-model="subLimit" :items="[10, 25, 50]" class="w-20" />
        </div>
      </div>

      <UTable :data="subscriptions" :columns="subscriptionColumns" :loading="loading" class="w-full table-fixed">
        <template #user-cell="{ row }">
          <div class="flex flex-col" v-if="row.original.user">
            <NuxtLink v-if="row.original.user.id" :to="`/admin/users/${row.original.user.id}`" class="text-gray-700 dark:text-gray-300 hover:underline font-medium">
              {{ row.original.user.displayname || row.original.user.username || 'Без імені' }}
            </NuxtLink>
            <span v-else class="font-medium text-gray-700 dark:text-gray-300">{{ row.original.user.displayname || 'Без імені' }}</span>
          </div>
          <span v-else class="text-gray-500">-</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status)">
            {{ translateSubscriptionStatus(row.original.status) }}
          </UBadge>
        </template>
        
        <template #planType-cell="{ row }">
          <span class="font-semibold">{{ row.original.planType }}</span>
        </template>

        <template #currentPeriodEnd-cell="{ row }">
          {{ row.original.currentPeriodEnd ? formatDate(row.original.currentPeriodEnd) : '-' }}
        </template>

        <template #actions-cell="{ row }">
          <UButton color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEditModal(row.original)" />
        </template>
      </UTable>

      <div v-if="subscriptionsMeta && subscriptionsMeta.totalPages > 1" class="flex justify-center mt-6">
        <AppPagination v-model:page="subPage" :total="subscriptionsMeta.totalItems" :items-per-page="subLimit" />
      </div>
    </div>

    <div v-else class="space-y-4">
      <!-- Payment Filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
        <USelect 
          v-model="payStatus" 
          :items="[
            { label: 'Усі статуси', value: 'all' },
            { label: 'SUCCESS - Успішно', value: 'SUCCESS' },
            { label: 'PENDING - Очікує', value: 'PENDING' },
            { label: 'FAILURE - Неуспішно', value: 'FAILURE' },
            { label: 'ERROR - Помилка', value: 'ERROR' },
            { label: 'REVERSED - Повернено', value: 'REVERSED' }
          ]" 
          class="w-full"
        />

        <div class="flex items-center justify-end gap-2 text-sm text-gray-500 font-medium">
          <span>На сторінці:</span>
          <USelect v-model="payLimit" :items="[10, 25, 50]" class="w-20" />
        </div>
      </div>

      <UTable :data="payments" :columns="paymentColumns" :loading="loading" class="w-full table-fixed">
        <template #user-cell="{ row }">
          <div class="flex flex-col" v-if="row.original.user">
            <NuxtLink v-if="row.original.user.id" :to="`/admin/users/${row.original.user.id}`" class="text-gray-700 dark:text-gray-300 hover:underline font-medium">
              {{ row.original.user.displayname || row.original.user.username || 'Без імені' }}
            </NuxtLink>
            <span v-else class="font-medium text-gray-700 dark:text-gray-300">{{ row.original.user.displayname || 'Без імені' }}</span>
          </div>
          <span v-else class="text-gray-500">-</span>
        </template>

        <template #amount-cell="{ row }">
          <span class="font-medium">{{ row.original.amount }} {{ row.original.currency }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status)">
            {{ translatePaymentStatus(row.original.status) }}
          </UBadge>
        </template>

        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
        </template>
      </UTable>

      <div v-if="paymentsMeta && paymentsMeta.totalPages > 1" class="flex justify-center mt-6">
        <AppPagination v-model:page="payPage" :total="paymentsMeta.totalItems" :items-per-page="payLimit" />
      </div>
    </div>

    <UModal 
      v-model:open="isStatusModalOpen" 
      title="Редагувати підписку"
    >
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">План</label>
            <USelect v-model="newPlanType" :items="planOptions" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Статус</label>
            <USelect v-model="newStatus" :items="statusOptions" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Діє до (опціонально)</label>
            <UInput type="date" v-model="newPeriodEnd" class="w-full" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="isStatusModalOpen = false">
            Скасувати
          </UButton>
          <UButton color="primary" @click="applyStatusChange">
            Зберегти
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
