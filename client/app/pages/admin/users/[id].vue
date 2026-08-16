<!--
@page-docs
title: User Details (Admin)
description: Detailed user profile view for administrators on the SMAK platform.
features:
  - View core user profile info (name, username, email, ID, roles, verification status).
  - View user dietary preferences and allergies/allergens.
  - View the list of recent recipes published by this user.
  - Perform administrative actions (ban/unban user account, change user role to admin or user, permanently delete user account).
  - Confirmation checkpoints requiring typing the user's nickname for safety.
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | User Details (Admin)'
})
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useAdminRecipes } from '~/composables/useAdminRecipes'
import RecipeCard from '~/components/recipe/card/RecipeCard.vue'
import RecipeGridSkeleton from '~/components/recipe/card/RecipeGridSkeleton.vue'
import { translateDietary, translateAllergy } from '~/utils/formatters'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const { fetchUser, updateUser, deleteUser, loading: adminLoading } = useAdminUsers()
const { recipes: userRecipes, loading: recipesLoading, meta: recipesMeta, fetchRecipes } = useAdminRecipes()

const userId = route.params.id as string

const { data: userProfile, pending: profileLoading, error: profileError, refresh: refreshProfile } = await useAsyncData(
  `admin-user-${userId}`,
  () => fetchUser(userId)
)

// Fetch user's recipes
const loadUserRecipes = async () => {
  try {
    await fetchRecipes({ userId, limit: 3 })
  } catch (err) {
    console.error('Failed to load user recipes', err)
  }
}

onMounted(() => {
  loadUserRecipes()
})

// Modals State
const isBanModalOpen = ref(false)
const isRoleModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

const banConfirmationInput = ref('')
const roleConfirmationInput = ref('')
const deleteConfirmationInput = ref('')

// Reset inputs when modals open/close
watch(isBanModalOpen, (newVal) => {
  if (!newVal) banConfirmationInput.value = ''
})
watch(isRoleModalOpen, (newVal) => {
  if (!newVal) roleConfirmationInput.value = ''
})
watch(isDeleteModalOpen, (newVal) => {
  if (!newVal) deleteConfirmationInput.value = ''
})

// Nickname match validations
const isBanConfirmed = computed(() => {
  if (!userProfile.value) return false
  if (userProfile.value.isBanned) return true
  return banConfirmationInput.value.trim() === userProfile.value.username
})

const isRoleConfirmed = computed(() => {
  if (!userProfile.value) return false
  if (userProfile.value.role === 'admin') return true
  return roleConfirmationInput.value.trim() === userProfile.value.username
})

const isDeleteConfirmed = computed(() => {
  if (!userProfile.value) return false
  return deleteConfirmationInput.value.trim() === userProfile.value.username
})

// Actions
const handleToggleBan = async () => {
  if (!userProfile.value || !isBanConfirmed.value) return
  try {
    const nextBanState = !userProfile.value.isBanned
    await updateUser(userId, { isBanned: nextBanState })
    await refreshProfile()
    isBanModalOpen.value = false
  } catch (err) {
    console.error('Failed to toggle ban status', err)
  }
}

const handleToggleRole = async () => {
  if (!userProfile.value || !isRoleConfirmed.value) return
  try {
    const nextRole = userProfile.value.role === 'admin' ? 'user' : 'admin'
    await updateUser(userId, { role: nextRole })
    await refreshProfile()
    isRoleModalOpen.value = false
  } catch (err) {
    console.error('Failed to toggle role', err)
  }
}

const handleDeleteUser = async () => {
  if (!userProfile.value || !isDeleteConfirmed.value) return
  try {
    await deleteUser(userId)
    isDeleteModalOpen.value = false
    router.push('/admin/users')
  } catch (err) {
    console.error('Failed to delete user', err)
  }
}

const getUserInitials = () => {
  if (!userProfile.value) return 'U'
  const name = userProfile.value.displayname || userProfile.value.username || 'U'
  return name.substring(0, 2).toUpperCase()
}

// Translations for dietary and allergies using centralized formatters
const getDietLabel = (diet: string) => {
  let normalized = diet
  if (diet === 'gluten_free') normalized = 'Gluten_free'
  else if (diet === 'dairy_free') normalized = 'Dairy_free'
  else if (diet === 'nut_free') normalized = 'Nut_free'
  else if (diet.length > 0) {
    normalized = diet.charAt(0).toUpperCase() + diet.slice(1)
  }
  return translateDietary(normalized).label
}

const getAllergyLabel = (allergy: string) => {
  if (!allergy) return ''
  const normalized = allergy.charAt(0).toUpperCase() + allergy.slice(1)
  return translateAllergy(normalized).label
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto text-left">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white" v-if="userProfile">
          Профіль користувача
        </h1>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white" v-else>
          Завантаження деталей...
        </h1>
      </div>
      
      <div class="flex items-center gap-3" v-if="userProfile">
        <UBadge :color="userProfile.role === 'admin' ? 'coral' : 'neutral'" size="lg" variant="subtle" class="font-bold uppercase">
          {{ userProfile.role === 'admin' ? 'Адмін' : 'Користувач' }}
        </UBadge>
        <UBadge :color="userProfile.isBanned ? 'error' : 'success'" size="lg">
          {{ userProfile.isBanned ? 'Заблоковано' : 'Активний' }}
        </UBadge>
      </div>
    </div>

    <!-- Error State -->
    <UAlert v-if="profileError" color="error" icon="i-lucide-alert-triangle" :title="profileError.message" class="mb-6" />

    <!-- Loading State -->
    <div v-if="profileLoading" class="flex justify-center items-center h-64">
      <span class="text-gray-500">Завантаження деталей користувача...</span>
    </div>

    <!-- Content (Admin Recipe Grid Style) -->
    <div v-if="userProfile" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Main Info (Left Column: lg:col-span-2) -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- User Core Details Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">Основна інформація</h2>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <span class="text-sm text-gray-500">Ім'я (Displayname)</span>
              <p class="font-medium mt-0.5">{{ userProfile.displayname || 'Без імені' }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Username</span>
              <p class="font-mono font-medium mt-0.5">@{{ userProfile.username }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Email</span>
              <p class="font-medium mt-0.5">
                <a :href="`mailto:${userProfile.email}`" class="hover:text-coral-500 transition-colors hover:underline">
                  {{ userProfile.email }}
                </a>
              </p>
            </div>
            <div>
              <span class="text-sm text-gray-500">ID Користувача</span>
              <p class="font-mono text-xs text-smak-neutral-500 truncate mt-1" :title="userProfile.id">{{ userProfile.id }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Верифікований</span>
              <p class="mt-1">
                <UBadge :color="userProfile.isVerified ? 'success' : 'warning'" size="sm" variant="soft">
                  {{ userProfile.isVerified ? 'Так (Підтверджено)' : 'Ні (Непідтверджено)' }}
                </UBadge>
              </p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Статус доступу</span>
              <p class="mt-1">
                <UBadge :color="userProfile.isBanned ? 'error' : 'success'" size="sm" variant="solid">
                  {{ userProfile.isBanned ? 'Заблокований' : 'Активний' }}
                </UBadge>
              </p>
            </div>
          </div>

          <!-- Dietary preferences row -->
          <div class="mb-4">
            <span class="text-sm text-gray-500">Дієтичні вподобання</span>
            <div class="flex flex-wrap gap-1.5 mt-1.5">
              <UBadge 
                v-for="diet in userProfile.dietary" 
                :key="diet" 
                color="neutral" 
                variant="subtle"
                class="rounded-lg font-bold"
              >
                {{ getDietLabel(diet) }}
              </UBadge>
              <span v-if="!userProfile.dietary?.length" class="text-gray-500 text-sm italic">Не вказано</span>
            </div>
          </div>

          <!-- Allergies row -->
          <div>
            <span class="text-sm text-gray-500">Алергії та алергени</span>
            <div class="flex flex-wrap gap-1.5 mt-1.5">
              <UBadge 
                v-for="allergy in userProfile.allergies" 
                :key="allergy" 
                color="error" 
                variant="soft"
                class="rounded-lg font-bold"
              >
                {{ getAllergyLabel(allergy) }}
              </UBadge>
              <span v-if="!userProfile.allergies?.length" class="text-gray-500 text-sm italic">Відсутні</span>
            </div>
          </div>
        </div>

        <!-- Recent Authored Recipes Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div class="flex justify-between items-center mb-4 border-b pb-2">
            <h2 class="text-xl font-semibold">Останні публікації автора</h2>
            <UButton 
              :to="`/admin/recipes?userId=${userProfile.id}&author=${encodeURIComponent(userProfile.displayname || userProfile.username)}`"
              variant="link" 
              color="primary" 
              icon="i-lucide-external-link"
              class="font-bold text-xs p-0 cursor-pointer hover:no-underline"
            >
              Всі рецепти в адмінці
            </UButton>
          </div>

          <RecipeGridSkeleton v-if="recipesLoading" :count="3" />

          <div v-else-if="userRecipes.length === 0" class="py-10 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <UIcon name="i-lucide-utensils" class="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
            <p class="text-sm font-semibold text-gray-400">Цей користувач ще не опублікував жодного кулінарного рецепту.</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="recipe in userRecipes" :key="recipe.id">
              <RecipeCard :recipe="recipe" :is-admin="true" />
            </div>
          </div>
        </div>
      </div>

      <!-- Administration Controls & Meta (Right Column) -->
      <div class="space-y-6">
        
        <!-- Administrative Safeguard Controls Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">Модерація та Керування</h2>
          
          <p class="text-xs text-gray-500 mb-4 leading-relaxed">
            Використовуйте кнопки нижче для налаштування прав доступу користувача. Дії захищені двофакторним підтвердженням.
          </p>

          <div class="flex flex-col gap-3">
            <!-- Ban/Unban action -->
            <UButton 
              :color="userProfile.isBanned ? 'success' : 'error'" 
              variant="solid" 
              block
              class="rounded-xl font-bold cursor-pointer"
              :icon="userProfile.isBanned ? 'i-lucide-user-check' : 'i-lucide-ban'"
              @click="isBanModalOpen = true"
            >
              {{ userProfile.isBanned ? 'Розблокувати' : 'Заблокувати акаунт' }}
            </UButton>

            <!-- Role promotion action -->
            <UButton 
              color="neutral" 
              variant="outline" 
              block
              class="rounded-xl font-bold cursor-pointer"
              :icon="userProfile.role === 'admin' ? 'i-lucide-shield-alert' : 'i-lucide-shield'"
              @click="isRoleModalOpen = true"
            >
              {{ userProfile.role === 'admin' ? 'Зняти статус адміна' : 'Надати статус адміна' }}
            </UButton>

            <!-- Delete action -->
            <UButton 
              color="error" 
              variant="subtle" 
              block
              class="rounded-xl font-bold cursor-pointer mt-4"
              icon="i-lucide-trash-2"
              @click="isDeleteModalOpen = true"
            >
              Видалити користувача
            </UButton>
          </div>
        </div>

        <!-- System Stats / Information Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">Системна статистика</h2>
          
          <div class="space-y-4">
            <div>
              <span class="text-xs text-gray-500 uppercase tracking-wider block">Рецепти автора</span>
              <p class="text-2xl font-black font-heading text-gray-900 dark:text-white mt-0.5">
                {{ recipesMeta?.totalItems || 0 }}
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-500 uppercase tracking-wider block">Дієтичні вподобання</span>
              <p class="text-sm font-semibold mt-0.5 text-gray-800 dark:text-gray-200">
                {{ userProfile.dietary?.length || 0 }} вибрано
              </p>
            </div>
            <div>
              <span class="text-xs text-gray-500 uppercase tracking-wider block">Зареєстровані алергії</span>
              <p class="text-sm font-semibold mt-0.5 text-gray-800 dark:text-gray-200">
                {{ userProfile.allergies?.length || 0 }} вказано
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Modals Section -->

    <!-- Ban Status Change Modal -->
    <UModal 
      v-model:open="isBanModalOpen" 
      :ui="{ content: 'sm:max-w-md rounded-3xl' }"
    >
      <template #content>
        <div class="p-6 sm:p-8 space-y-6">
          <div class="space-y-2">
            <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              {{ userProfile?.isBanned ? 'Розблокувати користувача?' : 'Заблокувати користувача?' }}
            </h3>
            <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed">
              {{ userProfile?.isBanned 
                  ? `Ви впевнені, що хочете розблокувати акаунт @${userProfile?.username}? Користувач знову отримає повний доступ до свого кабінету та можливості публікації.` 
                  : `Блокування обмежить доступ користувача @${userProfile?.username} до його облікового запису та функцій публікації.` 
              }}
            </p>
          </div>

          <!-- Verify nickname block ONLY when BANNING -->
          <div v-if="userProfile && !userProfile.isBanned" class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <div class="flex items-start gap-2.5">
              <UIcon name="i-lucide-alert-triangle" class="text-amber-500 text-lg shrink-0 mt-0.5" />
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-bold text-amber-800 dark:text-amber-400">Потрібне підтвердження!</span>
                <span class="text-xs text-amber-700 dark:text-amber-500">
                  Будь ласка, введіть нікнейм користувача для блокування його профілю.
                </span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider block">
                Введіть нікнейм (<span class="font-mono font-bold text-smak-neutral-900 dark:text-white select-all">{{ userProfile.username }}</span>):
              </label>
              <UInput v-model="banConfirmationInput" placeholder="Введіть нікнейм..." color="neutral" />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <UButton 
              label="Скасувати" 
              color="neutral" 
              variant="ghost" 
              class="flex-1 justify-center rounded-xl py-3 font-bold cursor-pointer"
              @click="isBanModalOpen = false" 
            />
            <UButton 
              :label="userProfile?.isBanned ? 'Розблокувати' : 'Заблокувати'" 
              :color="userProfile?.isBanned ? 'success' : 'error'" 
              variant="solid"
              class="flex-1 justify-center rounded-xl py-3 font-bold cursor-pointer"
              :loading="adminLoading"
              :disabled="adminLoading || !isBanConfirmed"
              @click="handleToggleBan" 
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Role Change Modal -->
    <UModal 
      v-model:open="isRoleModalOpen" 
      :ui="{ content: 'sm:max-w-md rounded-3xl' }"
    >
      <template #content>
        <div class="p-6 sm:p-8 space-y-6">
          <div class="space-y-2">
            <h3 class="text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
              {{ userProfile?.role === 'admin' ? 'Зняти статус адміністратора?' : 'Надати статус адміністратора?' }}
            </h3>
            <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed">
              {{ userProfile?.role === 'admin'
                  ? `Ви збираєтесь понизити акаунт @${userProfile?.username} до рівня звичайного користувача. Він втратить доступ до адмін-панелі та модераційних інструментів.` 
                  : `Користувач @${userProfile?.username} отримає повні адміністративні права, включаючи можливість видалення рецептів та керування іншими користувачами.` 
              }}
            </p>
          </div>

          <!-- Verify nickname block ONLY when PROMOTING to ADMIN -->
          <div v-if="userProfile && userProfile.role !== 'admin'" class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <div class="flex items-start gap-2.5">
              <UIcon name="i-lucide-shield-alert" class="text-amber-500 text-lg shrink-0 mt-0.5" />
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-bold text-amber-800 dark:text-amber-400">Увага! Надання високих прав!</span>
                <span class="text-xs text-amber-700 dark:text-amber-500">
                  Будь ласка, введіть нікнейм користувача для надання йому прав адміністратора.
                </span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider block">
                Введіть нікнейм (<span class="font-mono font-bold text-smak-neutral-900 dark:text-white select-all">{{ userProfile.username }}</span>):
              </label>
              <UInput v-model="roleConfirmationInput" placeholder="Введіть нікнейм..." color="neutral" />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <UButton 
              label="Скасувати" 
              color="neutral" 
              variant="ghost" 
              class="flex-1 justify-center rounded-xl py-3 font-bold cursor-pointer"
              @click="isRoleModalOpen = false" 
            />
            <UButton 
              :label="userProfile?.role === 'admin' ? 'Зняти статус' : 'Надати права'" 
              color="primary" 
              variant="solid"
              class="flex-1 justify-center rounded-xl py-3 font-bold cursor-pointer"
              :loading="adminLoading"
              :disabled="adminLoading || !isRoleConfirmed"
              @click="handleToggleRole" 
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal (Nickname Verified) -->
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
              Ви впевнені, що хочете видалити акаунт користувача <span class="font-bold text-smak-neutral-900 dark:text-white">{{ userProfile?.displayname || userProfile?.username }}</span>? Ця дія видалить всі пов'язані дані (рецепти, відгуки тощо) і є абсолютно незворотною.
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
                Введіть нікнейм (<span class="font-mono font-bold text-smak-neutral-900 dark:text-white select-all">{{ userProfile?.username }}</span>) для підтвердження:
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
              :loading="adminLoading"
              :disabled="adminLoading || !isDeleteConfirmed"
              @click="handleDeleteUser" 
            />
          </div>
        </div>
      </template>
    </UModal>

  </div>
</template>
