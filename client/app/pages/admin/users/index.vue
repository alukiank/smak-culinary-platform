<!--
@page-docs
title: User Management (Admin)
description: Admin panel section for managing users on the SMAK platform.
features:
  - View list of all registered users with paginated tables.
  - Search users by name or email and filter by role, verification, or ban status.
  - Open public chef profile or edit user details (change display name, change role to admin or user, ban/unban user).
  - Delete user accounts permanently with username confirmation check.
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | User Management (Admin)'
})
import { ref, onMounted, watch, computed } from 'vue'
import { useAdminUsers } from '~/composables/useAdminUsers'
import type { UserPrivateDto, UpdateUserAdminDto } from '~/types/user'
import AppPagination from '~/components/shared/AppPagination.vue'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin'
})

const { users, loading, error, meta, fetchUsers, updateUser, deleteUser } = useAdminUsers()

const columns = [
  { 
    accessorKey: 'name', 
    header: 'Користувач',
    meta: { class: { th: 'w-64 min-w-[16rem]', td: 'w-64 min-w-[16rem]' } }
  },
  { 
    accessorKey: 'email', 
    header: 'Email',
    meta: { class: { th: 'w-60 min-w-[15rem]', td: 'w-60 min-w-[15rem]' } }
  },
  { 
    accessorKey: 'role', 
    header: 'Роль',
    meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } }
  },
  { 
    accessorKey: 'isVerified', 
    header: 'Верифікація',
    meta: { class: { th: 'w-36 min-w-[9rem]', td: 'w-36 min-w-[9rem]' } }
  },
  { 
    accessorKey: 'isBanned', 
    header: 'Статус',
    meta: { class: { th: 'w-32 min-w-[8rem]', td: 'w-32 min-w-[8rem]' } }
  },
  { 
    accessorKey: 'actions', 
    header: 'Дії',
    meta: { class: { th: 'w-24 min-w-[6rem]', td: 'w-24 min-w-[6rem]' } }
  }
]

const page = ref(1)
const limit = ref(10)

// Filters
const query = ref('')
const selectedRole = ref<'all' | 'user' | 'admin'>('all')
const selectedBanStatus = ref<'all' | 'active' | 'banned'>('all')
const selectedVerifyStatus = ref<'all' | 'verified' | 'unverified'>('all')

const roleOptions = [
  { label: 'Всі ролі', value: 'all' },
  { label: 'Користувачі', value: 'user' },
  { label: 'Адміністратори', value: 'admin' }
]

const banOptions = [
  { label: 'Всі статуси', value: 'all' },
  { label: 'Активні', value: 'active' },
  { label: 'Заблоковані', value: 'banned' }
]

const verifyOptions = [
  { label: 'Всі верифікації', value: 'all' },
  { label: 'Підтверджені', value: 'verified' },
  { label: 'Непідтверджені', value: 'unverified' }
]

const loadUsers = () => {
  const searchVal = query.value.trim() || undefined
  const roleVal = selectedRole.value === 'all' ? undefined : selectedRole.value
  
  let isBannedVal: boolean | undefined = undefined
  if (selectedBanStatus.value === 'banned') {
    isBannedVal = true
  } else if (selectedBanStatus.value === 'active') {
    isBannedVal = false
  }

  let isVerifiedVal: boolean | undefined = undefined
  if (selectedVerifyStatus.value === 'verified') {
    isVerifiedVal = true
  } else if (selectedVerifyStatus.value === 'unverified') {
    isVerifiedVal = false
  }

  fetchUsers({
    page: page.value,
    limit: limit.value,
    search: searchVal,
    role: roleVal,
    isBanned: isBannedVal,
    isVerified: isVerifiedVal
  })
}

onMounted(() => {
  loadUsers()
})

watch([page, limit, selectedRole, selectedBanStatus, selectedVerifyStatus], () => {
  loadUsers()
})

// Debounce search
let searchTimeout: NodeJS.Timeout
watch(query, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1 // Reset to first page on search
    loadUsers()
  }, 500)
})

const filteredUsers = computed(() => {
  return users.value
})

// Modals State
const isEditModalOpen = ref(false)
const selectedUserForEdit = ref<UserPrivateDto | null>(null)
const editForm = ref({
  displayname: '',
  role: 'user' as 'user' | 'admin',
  isBanned: false
})

const editConfirmationInput = ref('')

const isBanAction = computed(() => {
  return editForm.value.isBanned && !selectedUserForEdit.value?.isBanned
})

const isAdminAction = computed(() => {
  return editForm.value.role === 'admin' && selectedUserForEdit.value?.role !== 'admin'
})

const needsEditConfirmation = computed(() => {
  return isBanAction.value || isAdminAction.value
})

const isEditConfirmed = computed(() => {
  if (!needsEditConfirmation.value) return true
  return editConfirmationInput.value.trim() === selectedUserForEdit.value?.username
})

const isDeleteModalOpen = ref(false)
const selectedUserForDelete = ref<UserPrivateDto | null>(null)
const deleteConfirmationInput = ref('')

const isDeleteConfirmed = computed(() => {
  return deleteConfirmationInput.value.trim() === selectedUserForDelete.value?.username
})

// Reset confirmation inputs when modals open/close
watch(isEditModalOpen, (newVal) => {
  if (!newVal) {
    editConfirmationInput.value = ''
  }
})

watch(isDeleteModalOpen, (newVal) => {
  if (!newVal) {
    deleteConfirmationInput.value = ''
  }
})

const getDropdownItems = (row: UserPrivateDto) => [
  [
    {
      label: 'Переглянути профіль',
      icon: 'i-lucide-user',
      to: `/admin/users/${row.id}`
    },
    {
      label: 'Редагувати',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        selectedUserForEdit.value = row
        editForm.value = {
          displayname: row.displayname || '',
          role: row.role || 'user',
          isBanned: !!row.isBanned
        }
        editConfirmationInput.value = ''
        setTimeout(() => {
          isEditModalOpen.value = true
        }, 50)
      }
    }
  ],
  [
    {
      label: 'Видалити',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        selectedUserForDelete.value = row
        deleteConfirmationInput.value = ''
        setTimeout(() => {
          isDeleteModalOpen.value = true
        }, 50)
      }
    }
  ]
] as any[][]

const applyUserUpdate = async () => {
  if (selectedUserForEdit.value && isEditConfirmed.value) {
    try {
      const updateData: UpdateUserAdminDto = {
        displayname: editForm.value.displayname,
        role: editForm.value.role,
        isBanned: editForm.value.isBanned
      }
      await updateUser(selectedUserForEdit.value.id, updateData)
      isEditModalOpen.value = false
    } catch (err) {
      console.error('Failed to update user', err)
    }
  }
}

const confirmDelete = async () => {
  if (selectedUserForDelete.value && isDeleteConfirmed.value) {
    try {
      await deleteUser(selectedUserForDelete.value.id)
      isDeleteModalOpen.value = false
    } catch (err) {
      console.error('Failed to delete user', err)
    }
  }
}

const getUserInitials = (user: UserPrivateDto) => {
  const name = user.displayname || user.username || 'U'
  return name.substring(0, 2).toUpperCase()
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold font-heading text-smak-neutral-900 dark:text-white">Управління користувачами</h1>
        <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400">
          Керування ролями, блокуванням та перегляд інформації про зареєстрованих користувачів.
        </p>
      </div>
      <UButton icon="i-lucide-refresh-cw" color="neutral" @click="loadUsers" :loading="loading">
        Оновити
      </UButton>
    </div>

    <!-- Metadata Summary -->
    <div v-if="meta" class="text-sm text-gray-500 mb-4">
      Всього знайдено: <span class="font-bold text-gray-900 dark:text-white">{{ meta.totalItems }}</span> користувачів
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <UInput 
        v-model="query" 
        icon="i-lucide-search" 
        placeholder="Пошук за ім'ям, email..." 
        class="md:col-span-2"
        color="neutral"
      />
      
      <USelect 
        v-model="selectedRole" 
        :items="roleOptions" 
        color="neutral"
      />

      <USelect 
        v-model="selectedVerifyStatus" 
        :items="verifyOptions" 
        color="neutral"
      />

      <USelect 
        v-model="selectedBanStatus" 
        :items="banOptions" 
        color="neutral"
      />
    </div>

    <!-- Limit and Pagination Meta Row -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <span class="text-xs text-smak-neutral-500">На сторінці:</span>
        <USelect v-model="limit" :items="[10, 20, 50]" class="w-20" size="xs" color="neutral" />
      </div>
    </div>

    <UAlert v-if="error" color="error" icon="i-lucide-alert-triangle" :title="error" class="mb-6 rounded-2xl" />
    
    <!-- Table -->
    <div class="rounded-2xl overflow-hidden bg-transparent">
      <UTable :data="filteredUsers" :columns="columns" :loading="loading" class="w-full table-fixed">
        
        <!-- User Cell with Avatar -->
        <template #name-cell="{ row }">
          <NuxtLink :to="`/admin/users/${row.original.id}`" class="flex items-center gap-3 py-1 group/userlink">
            <UAvatar 
              :alt="row.original.displayname || row.original.username" 
              :label="getUserInitials(row.original)" 
              size="sm" 
              class="bg-coral-50 text-coral-600 dark:bg-coral-950/20 dark:text-coral-400 font-bold shrink-0 rounded-xl group-hover/userlink:scale-105 transition-transform" 
            />
            <div class="flex flex-col min-w-0">
              <span class="font-semibold text-smak-neutral-900 dark:text-white truncate group-hover/userlink:text-coral-500 transition-colors">
                {{ row.original.displayname || 'Без імені' }}
              </span>
              <span class="text-xs text-smak-neutral-400 dark:text-smak-neutral-500 truncate">
                @{{ row.original.username }}
              </span>
            </div>
          </NuxtLink>
        </template>

        <!-- Email Cell -->
        <template #email-cell="{ row }">
          <div class="flex items-center gap-1.5 py-1 min-w-0">
            <UIcon name="i-lucide-mail" class="text-smak-neutral-400 text-sm shrink-0" />
            <a :href="`mailto:${row.original.email}`" class="text-sm text-smak-neutral-600 dark:text-smak-neutral-400 hover:text-coral-500 dark:hover:text-coral-400 hover:underline truncate">
              {{ row.original.email }}
            </a>
          </div>
        </template>

        <!-- Role Cell -->
        <template #role-cell="{ row }">
          <UBadge 
            :color="row.original.role === 'admin' ? 'coral' : 'neutral'" 
            variant="subtle"
            class="rounded-lg px-2 py-0.5 font-bold uppercase text-[10px]"
          >
            <template #leading v-if="row.original.role === 'admin'">
              <UIcon name="i-lucide-shield" class="text-xs mr-0.5" />
            </template>
            {{ row.original.role === 'admin' ? 'Адмін' : 'Юзер' }}
          </UBadge>
        </template>

        <!-- Verification Cell -->
        <template #isVerified-cell="{ row }">
          <UBadge 
            :color="row.original.isVerified ? 'success' : 'warning'" 
            variant="soft" 
            class="rounded-lg px-2 py-0.5 font-medium text-xs"
          >
            <template #leading>
              <UIcon :name="row.original.isVerified ? 'i-lucide-check-circle-2' : 'i-lucide-help-circle'" class="text-xs mr-0.5" />
            </template>
            {{ row.original.isVerified ? 'Підтверджено' : 'Не підтверджено' }}
          </UBadge>
        </template>

        <!-- Ban Status Cell -->
        <template #isBanned-cell="{ row }">
          <UBadge 
            :color="row.original.isBanned ? 'error' : 'success'" 
            variant="solid" 
            class="rounded-lg px-2 py-0.5 font-semibold text-xs"
          >
            <template #leading>
              <UIcon :name="row.original.isBanned ? 'i-lucide-ban' : 'i-lucide-user-check'" class="text-xs mr-0.5" />
            </template>
            {{ row.original.isBanned ? 'Заблоковано' : 'Активний' }}
          </UBadge>
        </template>

        <!-- Actions Dropdown -->
        <template #actions-cell="{ row }">
          <UDropdownMenu :items="getDropdownItems(row.original)">
            <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" class="hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 rounded-xl" />
          </UDropdownMenu>
        </template>
      </UTable>
      
      <!-- Empty State -->
      <div v-if="!loading && filteredUsers.length === 0" class="py-12 flex flex-col items-center justify-center text-center">
        <UIcon name="i-lucide-users-2" class="text-4xl text-smak-neutral-300 dark:text-smak-neutral-700 mb-3" />
        <p class="text-smak-neutral-500 dark:text-smak-neutral-400 font-medium">Користувачів не знайдено за обраними фільтрами</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.totalPages > 1" class="flex justify-center mt-6 w-full">
      <AppPagination v-model:page="page" :total="meta.totalItems" :items-per-page="limit" />
    </div>

    <!-- Edit User Modal -->
    <UModal 
      v-model:open="isEditModalOpen" 
      :ui="{ content: 'sm:max-w-md rounded-3xl' }"
    >
      <template #content>
        <div class="p-6 sm:p-8 space-y-6">
          <div class="space-y-1.5">
            <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              Редагування користувача
            </h3>
            <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 font-mono">
              ID: {{ selectedUserForEdit?.id }}
            </p>
          </div>

          <div class="space-y-5">
            <!-- Email (Readonly) -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider">Email</label>
              <UInput :value="selectedUserForEdit?.email" disabled class="opacity-75" color="neutral" />
            </div>

            <!-- Username (Readonly) -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider">Юзернейм</label>
              <UInput :value="`@${selectedUserForEdit?.username}`" disabled class="opacity-75" color="neutral" />
            </div>

            <!-- Display Name (Editable) -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider">Ім'я для відображення</label>
              <UInput v-model="editForm.displayname" placeholder="Введіть ім'я" color="neutral" />
            </div>

            <!-- Role Select -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider">Роль</label>
              <USelect 
                v-model="editForm.role" 
                :items="[
                  { label: 'Користувач (User)', value: 'user' },
                  { label: 'Адміністратор (Admin)', value: 'admin' }
                ]" 
                color="neutral"
              />
            </div>

            <!-- Ban Toggle -->
            <div class="flex items-center justify-between p-4 rounded-2xl bg-smak-neutral-50 dark:bg-smak-neutral-800/40 border border-smak-neutral-100 dark:border-smak-neutral-800">
              <div class="flex flex-col gap-1">
                <span class="text-sm font-semibold text-smak-neutral-900 dark:text-white">Заблокувати користувача</span>
                <span class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400">Обмежити доступ до захищених функцій</span>
              </div>
              <USwitch v-model="editForm.isBanned" color="error" size="sm" class="shrink-0" />
            </div>

            <!-- Nickel Confirm Banner for Edit Action -->
            <div v-if="needsEditConfirmation" class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
              <div class="flex items-start gap-2.5">
                <UIcon name="i-lucide-alert-triangle" class="text-amber-500 text-lg shrink-0 mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-bold text-amber-800 dark:text-amber-400">Потрібне підтвердження!</span>
                  <span class="text-xs text-amber-700 dark:text-amber-500">
                    Ви збираєтесь <span v-if="isBanAction" class="font-bold">заблокувати</span>
                    <span v-if="isBanAction && isAdminAction"> та </span>
                    <span v-if="isAdminAction" class="font-bold">надати права адміністратора</span> для цього користувача.
                  </span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[11px] font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider block">
                  Введіть нікнейм (<span class="font-mono font-bold text-smak-neutral-900 dark:text-white select-all">{{ selectedUserForEdit?.username }}</span>) для підтвердження:
                </label>
                <UInput v-model="editConfirmationInput" placeholder="Введіть нікнейм..." color="neutral" />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <UButton 
              label="Скасувати" 
              color="neutral" 
              variant="ghost" 
              class="flex-1 justify-center rounded-xl py-3 font-bold cursor-pointer"
              @click="isEditModalOpen = false" 
            />
            <UButton 
              label="Зберегти" 
              color="primary" 
              variant="solid"
              class="flex-1 justify-center rounded-xl py-3 font-bold shadow-lg shadow-primary-500/20 cursor-pointer"
              :loading="loading"
              :disabled="loading || !isEditConfirmed"
              @click="applyUserUpdate" 
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal (Customized with Nickname Verification) -->
    <UModal 
      v-model:open="isDeleteModalOpen" 
      :ui="{ content: 'sm:max-w-md rounded-3xl' }"
    >
      <template #content>
        <div class="p-6 sm:p-8 space-y-6">
          <div class="space-y-2">
            <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              Видалити акаунт користувача?
            </h3>
            <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed">
              Ви впевнені, що хочете видалити акаунт користувача <span class="font-bold text-smak-neutral-900 dark:text-white">{{ selectedUserForDelete?.displayname || selectedUserForDelete?.username }}</span>? Ця дія видалить всі пов'язані дані (рецепти, відгуки тощо) і є абсолютно незворотною.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
            <div class="flex items-start gap-2.5">
              <UIcon name="i-lucide-shield-alert" class="text-rose-500 text-lg shrink-0 mt-0.5" />
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-bold text-rose-800 dark:text-rose-400">Небезпечна дія!</span>
                <span class="text-xs text-rose-700 dark:text-rose-500">
                  Видалення акаунта є незворотним. Будь ласка, введіть нікнейм для підтвердження.
                </span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider block">
                Введіть нікнейм (<span class="font-mono font-bold text-smak-neutral-900 dark:text-white select-all">{{ selectedUserForDelete?.username }}</span>) для підтвердження:
              </label>
              <UInput v-model="deleteConfirmationInput" placeholder="Введіть нікнейм..." color="neutral" />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <UButton 
              label="Скасувати" 
              color="neutral" 
              variant="ghost" 
              class="flex-1 justify-center rounded-xl py-3 font-bold cursor-pointer"
              @click="isDeleteModalOpen = false" 
            />
            <UButton 
              label="Видалити назавжди" 
              color="error" 
              variant="solid"
              class="flex-1 justify-center rounded-xl py-3 font-bold shadow-lg shadow-rose-500/20 cursor-pointer"
              :loading="loading"
              :disabled="loading || !isDeleteConfirmed"
              @click="confirmDelete" 
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
