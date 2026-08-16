<!--
@page-docs
title: <Profile Settings>
description: Personal account of the kulinar. Allows you to edit personal data, configure food restrictions (allergies, diets), manage security (passwords) and delete your account.
features:
  - <Editing profile>: <change username, public display name and email.> 
  - <Email verification>: <display status of email confirmation and ability to resend request to activate your account.>
  - <Food restrictions and diets> (available for PRO-users): <setting up a list of allergies (e.g., nuts, lactose, gluten, etc.) and diets (e.g., vegetarianism, veganism, keto), which the AI automatically uses to adapt recipes.>
  - <Account security>: <changing the current password to a new one with an interactive password strength indicator (requires at least 12 characters, uppercase/lowercase letters, numbers and special characters).>
  - <Risk zone>: <possibility of irreversible deletion of the user's account with confirmation by entering a unique username.>
-->

<script setup lang="ts">
useSeoMeta({
  title: 'Smak | Налаштування профілю'
})
import { useUser } from '~/composables/useUser'
import { useAuth } from '~/composables/useAuth'
import { useBilling } from '~/composables/useBilling'

definePageMeta({
  middleware: 'auth',
  layout: 'profile'
})

const { user, fetchProfile, updateProfile, updatePassword, deleteAccount, getRestrictions } = useUser()
const { resendVerificationEmail } = useAuth()
const { activePlan, triggerUpgradeModal, fetchSubscription } = useBilling()
const toast = useToast()

const isFreePlan = computed(() => activePlan.value === 'FREE')

const activeTab = ref<'profile' | 'restrictions' | 'security' | 'danger'>('profile')
const pageLoading = ref(true)
const actionLoading = ref(false)

// Tab options
const tabs = [
  { id: 'profile' as const, label: 'Особисті дані', description: 'Керуйте своїми іменами, електронною адресою та верифікацією профілю.' },
  { id: 'restrictions' as const, label: 'Харчові обмеження', description: 'Налаштуйте ваші алергії та дієти для персоналізації ШІ-рецептів.' },
  { id: 'security' as const, label: 'Безпека та пароль', description: 'Захистіть свій кулінарний записник та оновіть пароль акаунту.' },
  { id: 'danger' as const, label: 'Видалення акаунту', description: 'Незворотне та повне видалення вашого облікового запису SMAK.' }
]

// --- State for Profile Tab ---
const profileForm = ref({
  username: '',
  displayname: '',
  email: ''
})

// --- State for Restrictions Tab ---
const allergies = ref<string[]>([])
const dietary = ref<string[]>([])

// --- State for Password Tab ---
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// --- State for Danger Zone (Delete) ---
const isDeleteModalOpen = ref(false)
const confirmUsername = ref('')

// Initialize and sync profile data
const syncProfileData = () => {
  if (user.value) {
    profileForm.value = {
      username: user.value.username || '',
      displayname: user.value.displayname || '',
      email: user.value.email || ''
    }
  }
}

// Load restrictions from backend
const loadUserRestrictions = async () => {
  const restrictions = await getRestrictions()
  if (restrictions) {
    allergies.value = [...(restrictions.allergies || [])]
    dietary.value = [...(restrictions.dietary || [])]
  } else {
    // Fallback to local user properties if available
    allergies.value = [...(user.value?.allergies || [])]
    dietary.value = [...(user.value?.dietary || [])]
  }
}

// Fetch fresh data on mount
onMounted(async () => {
  pageLoading.value = true

  try {
    await fetchSubscription()
    await fetchProfile()
    syncProfileData()
    await loadUserRestrictions()
  } catch (err) {
    console.error('Error initializing profile page:', err)
  } finally {
    pageLoading.value = false
  }
})

// Watch user state to keep in sync
watch(user, () => {
  syncProfileData()
}, { deep: true })

// --- Form Actions ---

const handleResendVerification = async () => {
  actionLoading.value = true
  const res = await resendVerificationEmail()
  actionLoading.value = false

  if (res.success) {
    toast.add({
      title: 'Лист надіслано!',
      description: 'Перевірте вашу поштову скриньку для підтвердження email.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } else {
    toast.add({
      title: 'Помилка',
      description: res.error,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Save profile info (PUT /users/me)
const handleSaveProfile = async () => {
  if (!profileForm.value.username || !profileForm.value.displayname || !profileForm.value.email) {
    toast.add({
      title: 'Помилка валідації',
      description: 'Будь ласка, заповніть усі обов’язкові поля.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  actionLoading.value = true
  const res = await updateProfile({
    username: profileForm.value.username,
    displayname: profileForm.value.displayname,
    email: profileForm.value.email
  })
  actionLoading.value = false

  if (res.success) {
    toast.add({
      title: 'Профіль оновлено!',
      description: 'Ваші особисті дані успішно збережені.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } else {
    toast.add({
      title: 'Помилка збереження',
      description: res.error,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}


// Save restrictions (PUT /users/me updates the lists)
const handleSaveRestrictions = async () => {
  actionLoading.value = true
  // Update user profile with new allergies and dietary preferences arrays
  const res = await updateProfile({
    allergies: allergies.value,
    dietary: dietary.value
  })
  actionLoading.value = false

  if (res.success) {
    toast.add({
      title: 'Обмеження оновлено!',
      description: 'Ваші харчові обмеження та вподобання успішно збережені.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } else {
    toast.add({
      title: 'Помилка збереження',
      description: res.error,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Update password (PATCH /users/me/password)
const handleUpdatePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value

  if (!oldPassword || !newPassword || !confirmPassword) {
    toast.add({
      title: 'Помилка валідації',
      description: 'Будь ласка, заповніть усі паролі.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  if (newPassword !== confirmPassword) {
    toast.add({
      title: 'Паролі не збігаються',
      description: 'Новий пароль та підтвердження мають бути однаковими.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  if (newPassword.length < 12) {
    toast.add({
      title: 'Слабкий пароль',
      description: 'Новий пароль має містити не менше 12 символів.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  actionLoading.value = true
  const res = await updatePassword({ oldPassword, newPassword })
  actionLoading.value = false

  if (res.success) {
    toast.add({
      title: 'Пароль успішно змінено!',
      description: 'Ваш новий пароль активовано.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    // Reset form
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } else {
    toast.add({
      title: 'Помилка зміни пароля',
      description: res.error,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Delete Account (DELETE /users/me)
const handleDeleteAccount = async () => {
  if (confirmUsername.value !== user.value?.username) {
    toast.add({
      title: 'Невірна перевірка',
      description: 'Будь ласка, введіть ваш точний юзернейм для підтвердження.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  actionLoading.value = true
  const res = await deleteAccount()
  actionLoading.value = false

  if (res.success) {
    toast.add({
      title: 'Акаунт видалено',
      description: 'Ваш акаунт було успішно видалено. Нам буде вас не вистачати!',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    
    // Redirect is handled inside deleteAccount()
  } else {
    toast.add({
      title: 'Помилка видалення',
      description: res.error || 'Не вдалося видалити акаунт. Спробуйте пізніше.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
  
  isDeleteModalOpen.value = false
}

// Password strength checker helper
const passwordStrength = computed(() => {
  const pass = passwordForm.value.newPassword
  if (!pass) return { score: 0, text: 'Введіть новий пароль', color: 'neutral' }
  let score = 0
  if (pass.length >= 8) score++
  if (pass.length >= 12) score++
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++
  
  if (score <= 2) return { score, text: 'Слабкий', color: 'error' }
  if (score <= 4) return { score, text: 'Середній', color: 'warning' }
  return { score, text: 'Надійний', color: 'success' }
})
</script>

<template>
  <div class="w-full">
    <!-- Modern Sub-navigation Tab Bar -->
    <div class="border-b border-smak-neutral-200 dark:border-smak-neutral-800 mb-8">
      <nav class="flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-hide -mb-px" aria-label="Налаштування профілю">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="pb-3.5 px-0.5 inline-flex items-center border-b-2 text-sm sm:text-base font-bold whitespace-nowrap transition-colors duration-200 cursor-pointer focus:outline-none"
          :class="[
            activeTab === tab.id
              ? 'border-coral-500 text-coral-600 dark:text-coral-400 font-extrabold'
              : 'border-transparent text-smak-neutral-500 dark:text-smak-neutral-400 hover:text-smak-neutral-800 dark:hover:text-smak-neutral-200 hover:border-smak-neutral-300 dark:hover:border-smak-neutral-700'
          ]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Main Content Container -->
    <div class="relative min-h-85">
      <!-- Loading Overlay -->
      <div v-if="pageLoading" class="absolute inset-0 bg-white/80 dark:bg-smak-neutral-950/80 flex items-center justify-center z-30 backdrop-blur-xs">
        <div class="flex flex-col items-center gap-3 animate-pulse">
          <div class="w-10 h-10 rounded-xl bg-coral-500/10 flex items-center justify-center text-coral-500">
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
          </div>
          <span class="text-xs font-black uppercase tracking-wider text-smak-neutral-400">Завантаження...</span>
        </div>
      </div>

      <!-- Tab 1: Profile Details -->
            <div v-if="activeTab === 'profile'" class="space-y-6">
              <div class="space-y-1.5">
                <h2 class="text-xl sm:text-2xl font-heading font-black text-smak-neutral-900 dark:text-white">
                  Особисті дані
                </h2>
                <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                  Керуйте своїми іменами та електронною адресою. Вони відображаються у ваших публікаціях та коментарях.
                </p>
              </div>

              <!-- Email Verification Notice (At the top, high contrast) -->
              <div>
                <div v-if="user && !user.isVerified" class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-500/12 border border-amber-500/40 text-amber-700 dark:text-amber-400 backdrop-blur-md animate-fade-in">
                  <div class="flex items-start gap-3.5">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 text-amber-500">
                      <UIcon name="i-lucide-mail-warning" class="w-5.5 h-5.5" />
                    </div>
                    <div class="space-y-1">
                      <h4 class="font-black text-sm uppercase tracking-wide">Пошта не підтверджена</h4>
                      <p class="text-sm sm:text-base leading-relaxed opacity-90">
                        Підтвердіть ваш email, щоб отримати повний доступ до всіх можливостей кулінарної платформи (можливість залишати коментарі, публікувати рецепти тощо).
                      </p>
                    </div>
                  </div>
                  <UButton
                    size="xl"
                    variant="outline"
                    color="neutral"
                    class="w-full sm:w-auto justify-center rounded-xl font-semibold shrink-0 hover:border-amber-400 hover:text-amber-500 dark:hover:border-amber-600 dark:hover:text-amber-400 transition-smooth cursor-pointer px-8"
                    :loading="actionLoading"
                    @click="handleResendVerification"
                  >
                    Надіслати знову
                  </UButton>
                </div>
                
                <div v-else-if="user && user.isVerified" class="flex items-center gap-3.5 p-4.5 rounded-2xl bg-emerald-500/12 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 animate-fade-in">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-500">
                    <UIcon name="i-lucide-badge-check" class="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h4 class="font-black text-sm uppercase tracking-wide">Пошта підтверджена</h4>
                    <p class="text-sm sm:text-base font-semibold opacity-90">
                      Ваш обліковий запис SMAK повністю верифіковано та захищено.
                    </p>
                  </div>
                </div>
              </div>

            <!-- Profile Form Grid -->
            <form @submit.prevent="handleSaveProfile" class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div class="md:col-span-2">
                <UFormField label="Юзернейм (унікальний нікнейм)" required>
                  <UInput
                    v-model="profileForm.username"
                    type="text"
                    icon="i-lucide-at-sign"
                    placeholder="johndoe"
                    size="lg"
                    class="w-full"
                    :ui="{ base: 'rounded-full focus-visible:ring-2 focus-visible:ring-coral-400 border-smak-neutral-200 dark:border-smak-neutral-800 py-3 px-4.5 text-sm sm:text-base font-medium' }"
                    required
                  />
                </UFormField>
              </div>

              <div class="md:col-span-1">
                <UFormField label="Ім’я для відображення профілю" required>
                  <UInput
                    v-model="profileForm.displayname"
                    type="text"
                    icon="i-lucide-user"
                    placeholder="Іван Франко"
                    size="lg"
                    class="w-full"
                    :ui="{ base: 'rounded-full focus-visible:ring-2 focus-visible:ring-coral-400 border-smak-neutral-200 dark:border-smak-neutral-800 py-3 px-4.5 text-sm sm:text-base font-medium' }"
                    required
                  />
                </UFormField>
              </div>

              <div class="md:col-span-1">
                <UFormField label="Електронна пошта" required>
                  <UInput
                    v-model="profileForm.email"
                    type="email"
                    icon="i-lucide-mail"
                    placeholder="john@example.com"
                    size="lg"
                    class="w-full"
                    :ui="{ base: 'rounded-full focus-visible:ring-2 focus-visible:ring-coral-400 border-smak-neutral-200 dark:border-smak-neutral-800 py-3 px-4.5 text-sm sm:text-base font-medium' }"
                    required
                  />
                </UFormField>
              </div>

              <div class="md:col-span-2 flex flex-col sm:flex-row justify-end pt-4 mt-2">
                <UButton
                  type="submit"
                  variant="outline"
                  color="neutral"
                  size="xl"
                  :loading="actionLoading"
                  class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-coral-300 hover:text-coral-500 dark:hover:border-coral-700 dark:hover:text-coral-400 transition-smooth cursor-pointer px-8"
                >
                  Зберегти зміни
                </UButton>
              </div>
            </form>
          </div>

          <!-- Tab 2: Dietary Restrictions & Allergies -->
          <div v-if="activeTab === 'restrictions'" class="space-y-6 min-h-85">
            <div class="space-y-1.5">
              <h2 class="text-xl sm:text-2xl font-heading font-black text-smak-neutral-900 dark:text-white">
                Харчові обмеження та вподобання
              </h2>
              <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                Зазначте ваші алергії та дієтичні обмеження. ШІ-помічник враховуватиме їх під час автозаміни інгредієнтів у рецептах.
              </p>
            </div>

            <!-- Clean Pro Card Banner for Free Plan -->
            <div v-if="isFreePlan && !pageLoading" class="p-6 sm:p-8 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col items-center text-center space-y-4 my-2">
              <div class="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <UIcon name="i-lucide-lock" class="w-6 h-6" />
              </div>
              <div class="space-y-1.5 max-w-md mx-auto">
                <h3 class="text-lg sm:text-xl font-heading font-black text-smak-neutral-900 dark:text-white">
                  Персоналізація дієт та алергенів
                </h3>
                <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                  Налаштуйте власні алергії та дієтичні обмеження, щоб ШІ автоматично адаптував та персоналізував рецепти під ваші харчові потреби.
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

            <template v-else-if="!isFreePlan">
              <!-- Allergies Section -->
              <div class="space-y-4">
                <label class="text-sm font-semibold text-smak-neutral-800 dark:text-smak-neutral-200 block">
                  Алергії та непереносимість
                </label>
                
                <ProfileAllergiesSelector v-model="allergies" />
              </div>

              <!-- Dietary Prefs Section -->
              <div class="space-y-4 pt-4">
                <label class="text-sm font-semibold text-smak-neutral-800 dark:text-smak-neutral-200 block">
                  Дієти та стиль харчування
                </label>
                
                <ProfileDietsSelector v-model="dietary" />
              </div>

              <!-- Save restrictions button -->
              <div class="flex flex-col sm:flex-row justify-end pt-4 mt-6">
                <UButton
                  variant="outline"
                  color="neutral"
                  size="xl"
                  :loading="actionLoading"
                  class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-coral-300 hover:text-coral-500 dark:hover:border-coral-700 dark:hover:text-coral-400 transition-smooth cursor-pointer px-8"
                  @click="handleSaveRestrictions"
                >
                  Зберегти вподобання
                </UButton>
              </div>
            </template>
          </div>

          <!-- Tab 3: Security & Password Change -->
          <div v-if="activeTab === 'security'" class="space-y-6">
            <div class="space-y-1.5">
              <h2 class="text-xl sm:text-2xl font-heading font-black text-smak-neutral-900 dark:text-white">
                Безпека акаунту та пароль
              </h2>
              <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                Захистіть свій кулінарний записник. Регулярно оновлюйте свій пароль для більшої безпеки.
              </p>
            </div>

            <form @submit.prevent="handleUpdatePassword" class="space-y-5">
              <!-- Old Password Field -->
              <UFormField label="Поточний пароль" required>
                <UInput
                  v-model="passwordForm.oldPassword"
                  :type="showOldPassword ? 'text' : 'password'"
                  icon="i-lucide-lock"
                  placeholder="••••••••••••"
                  size="lg"
                  class="w-full"
                  :ui="{ base: 'rounded-full focus-visible:ring-2 focus-visible:ring-coral-400 border-smak-neutral-200 dark:border-smak-neutral-800 py-3 px-4.5 text-sm sm:text-base font-medium' }"
                  required
                >
                  <template #trailing>
                    <button
                      type="button"
                      class="text-smak-neutral-400 hover:text-smak-neutral-600 dark:hover:text-smak-neutral-300 transition-colors p-1.5 cursor-pointer flex items-center justify-center focus:outline-none"
                      @click="showOldPassword = !showOldPassword"
                    >
                      <UIcon :name="showOldPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-5 h-5" />
                    </button>
                  </template>
                </UInput>
              </UFormField>

              <!-- New Password Field -->
              <UFormField label="Новий пароль" required>
                <UInput
                  v-model="passwordForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  icon="i-lucide-shield-check"
                  placeholder="Мінімум 12 символів"
                  size="lg"
                  class="w-full"
                  :ui="{ base: 'rounded-full focus-visible:ring-2 focus-visible:ring-coral-400 border-smak-neutral-200 dark:border-smak-neutral-800 py-3 px-4.5 text-sm sm:text-base font-medium' }"
                  required
                >
                  <template #trailing>
                    <button
                      type="button"
                      class="text-smak-neutral-400 hover:text-smak-neutral-600 dark:hover:text-smak-neutral-300 transition-colors p-1.5 cursor-pointer flex items-center justify-center focus:outline-none"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <UIcon :name="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-5 h-5" />
                    </button>
                  </template>
                </UInput>
              </UFormField>

              <!-- Password Strength Indicator -->
              <div v-if="passwordForm.newPassword" class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-smak-neutral-400">Надійність пароля:</span>
                  <span :class="[
                    passwordStrength.color === 'success' ? 'text-emerald-500' :
                    passwordStrength.color === 'warning' ? 'text-amber-500' : 'text-rose-500'
                  ]">{{ passwordStrength.text }}</span>
                </div>
                <div class="h-2 w-full rounded-full bg-smak-neutral-100 dark:bg-smak-neutral-800 overflow-hidden flex gap-0.5">
                  <div class="h-full flex-1 transition-all duration-500" 
                       :class="[
                         passwordStrength.score >= 1 
                           ? (passwordStrength.color === 'success' ? 'bg-emerald-500' : passwordStrength.color === 'warning' ? 'bg-amber-500' : 'bg-rose-500') 
                           : 'bg-transparent'
                       ]"></div>
                  <div class="h-full flex-1 transition-all duration-500" 
                       :class="[
                         passwordStrength.score >= 3 
                           ? (passwordStrength.color === 'success' ? 'bg-emerald-500' : 'bg-amber-500') 
                           : 'bg-transparent'
                       ]"></div>
                  <div class="h-full flex-1 transition-all duration-500" 
                       :class="[
                         passwordStrength.score >= 5 
                           ? 'bg-emerald-500' 
                           : 'bg-transparent'
                       ]"></div>
                </div>
              </div>

              <!-- Confirm Password Field -->
              <UFormField label="Підтвердження нового пароля" required>
                <UInput
                  v-model="passwordForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  icon="i-lucide-shield-check"
                  placeholder="Повторіть новий пароль"
                  size="lg"
                  class="w-full"
                  :ui="{ base: 'rounded-full focus-visible:ring-2 focus-visible:ring-coral-400 border-smak-neutral-200 dark:border-smak-neutral-800 py-3 px-4.5 text-sm sm:text-base font-medium' }"
                  required
                >
                  <template #trailing>
                    <button
                      type="button"
                      class="text-smak-neutral-400 hover:text-smak-neutral-600 dark:hover:text-smak-neutral-300 transition-colors p-1.5 cursor-pointer flex items-center justify-center focus:outline-none"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <UIcon :name="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-5 h-5" />
                    </button>
                  </template>
                </UInput>
              </UFormField>

              <div class="flex flex-col sm:flex-row justify-end pt-4 mt-2">
                <UButton
                  type="submit"
                  variant="outline"
                  color="neutral"
                  size="xl"
                  :loading="actionLoading"
                  class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-coral-300 hover:text-coral-500 dark:hover:border-coral-700 dark:hover:text-coral-400 transition-smooth cursor-pointer px-8"
                >
                  Оновити пароль
                </UButton>
              </div>
            </form>
          </div>

          <!-- Tab 4: Danger Zone -->
          <div v-if="activeTab === 'danger'" class="space-y-6 max-w-xl">
            <div class="space-y-1.5">
              <h2 class="text-xl sm:text-2xl font-heading font-black text-smak-neutral-900 dark:text-white">
                Видалення облікового запису
              </h2>
              <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed">
                Ви втратите свій кулінарний профіль, унікальне ім'я автора, усі ваші рецепти, відгуки, коментарі та повну історію чатів із ШІ-асистентом назавжди.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row mt-6 w-full sm:w-auto">
              <UButton
                type="button"
                variant="outline"
                color="neutral"
                size="xl"
                class="w-full sm:w-auto justify-center rounded-xl font-semibold hover:border-rose-400 hover:text-rose-500 dark:hover:border-rose-700 dark:hover:text-rose-400 transition-smooth cursor-pointer px-8"
                @click="() => { isDeleteModalOpen = true }"
              >
                Видалити акаунт
              </UButton>
            </div>
          </div>
        </div>

      <!-- Multi-step Danger Modal confirmation of deletion -->
      <UModal 
        v-model:open="isDeleteModalOpen"
        :ui="{
          overlay: 'z-[100]',
          content: 'z-[100] sm:max-w-sm rounded-3xl border border-smak-neutral-200 dark:border-smak-neutral-800 bg-white dark:bg-smak-neutral-900 shadow-2xl p-5 sm:p-6 overflow-hidden'
        }"
      >
        <template #content>
          <div class="space-y-4">
            <!-- Header area with title and close button -->
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-lg sm:text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
                Ви дійсно впевнені?
              </h3>
              <button
                type="button"
                class="p-1 rounded-full text-smak-neutral-400 hover:text-smak-neutral-700 dark:hover:text-smak-neutral-200 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
                aria-label="Закрити"
                @click="() => { isDeleteModalOpen = false; confirmUsername = '' }"
              >
                <UIcon name="i-lucide-x" class="w-4.5 h-4.5" />
              </button>
            </div>

            <p class="text-xs sm:text-sm text-smak-neutral-600 dark:text-smak-neutral-300 font-medium leading-relaxed">
              Цю дію неможливо скасувати. Всі ваші збережені рецепти, коментарі та історія листування будуть стерті назавжди.
            </p>

            <!-- Action input verification -->
            <div class="space-y-2 pt-1">
              <p class="text-xs text-smak-neutral-600 dark:text-smak-neutral-400 font-bold">
                Для підтвердження введіть ваш юзернейм <span class="text-rose-500">"{{ user?.username }}"</span>:
              </p>
              <UInput
                v-model="confirmUsername"
                type="text"
                placeholder="Введіть ваш юзернейм тут..."
                size="md"
                class="w-full"
                :ui="{ base: 'rounded-full focus-visible:ring-2 focus-visible:ring-rose-400 border-smak-neutral-200 dark:border-smak-neutral-800 py-2.5 px-4 text-xs sm:text-sm font-medium' }"
                required
              />
            </div>

            <!-- Buttons area -->
            <div class="flex items-center justify-end gap-2.5 pt-2">
              <UButton
                label="Скасувати"
                color="neutral"
                variant="ghost"
                class="rounded-full px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer bg-transparent hover:bg-transparent border border-transparent hover:border-smak-neutral-300 dark:hover:border-smak-neutral-700"
                @click="() => { isDeleteModalOpen = false; confirmUsername = '' }"
              />
              <UButton
                label="Видалити"
                color="error"
                variant="solid"
                class="rounded-full px-5 py-2 text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all hover:scale-105 bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25"
                :loading="actionLoading"
                :disabled="confirmUsername !== user?.username"
                @click="handleDeleteAccount"
              />
            </div>
          </div>
        </template>
      </UModal>
  </div>
</template>

<style scoped>
.bg-brand-gradient {
  background-image: linear-gradient(135deg, #F05B5B 0%, #F7934C 50%, #F6CB45 100%);
}
.transition-smooth {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hide scrollbar for mobile tab bar */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
