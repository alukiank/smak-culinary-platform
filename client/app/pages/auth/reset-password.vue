<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Smak | Створення нового пароля'
})

const { resetPassword } = useAuth()
const route = useRoute()
const toast = useToast()

const resetToken = computed(() => (route.query.token as string) || '')

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const isSuccess = ref(false)

const handleResetPassword = async () => {
  if (!resetToken.value) {
    errorMessage.value = 'Скидання неможливе: токен недійсний або прострочений'
    return
  }

  if (!password.value || !confirmPassword.value) {
    errorMessage.value = 'Будь ласка, заповніть усі поля'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Паролі не співпадають'
    return
  }

  if (password.value.length < 12) {
    errorMessage.value = 'Пароль повинен містити не менше 12 символів'
    return
  }

  const hasUppercase = /[A-Z]/.test(password.value)
  const hasLowercase = /[a-z]/.test(password.value)
  const hasDigit = /[0-9]/.test(password.value)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password.value)

  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
    errorMessage.value = 'Пароль повинен містити велику та малу літери, цифру та спецсимвол (!@#$%^&*)'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  const res = await resetPassword(resetToken.value, password.value)
  isLoading.value = false

  if (res.success) {
    isSuccess.value = true
    toast.add({
      title: 'Пароль змінено!',
      description: 'Ваш новий пароль встановлено успішно. Тепер ви можете увійти в кабінет.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } else {
    errorMessage.value = res.error || 'Не вдалося оновити пароль. Спробуйте пізніше'
    toast.add({
      title: 'Помилка скидання',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- Page Header -->
    <div class="text-center space-y-1.5">
      <h1 class="text-2xl sm:text-3xl font-bold font-heading text-neutral-900 dark:text-white tracking-tight">
        Новий пароль
      </h1>
      <p class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal">
        Придумайте новий надійний пароль для вашого акаунту
      </p>
    </div>

    <!-- Success View -->
    <div v-if="isSuccess" class="text-center space-y-4 py-3">
      <div class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-check-circle" class="w-8 h-8" />
      </div>
      <div class="space-y-1.5">
        <h3 class="text-lg font-bold text-neutral-900 dark:text-white">Пароль успішно оновлено!</h3>
        <p class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
          Тепер ви можете увійти в кабінет SMAK з новим паролем.
        </p>
      </div>
      <NuxtLink
        to="/auth/login"
        class="w-full bg-[#181a20] dark:bg-white text-white dark:text-[#181a20] font-bold rounded-xl py-3.5 sm:py-4 text-sm sm:text-base hover:bg-[#272a34] dark:hover:bg-neutral-100 transition-all duration-200 shadow-sm block text-center mt-2"
      >
        Увійти в акаунт
      </NuxtLink>
    </div>

    <!-- Form View -->
    <template v-else>
      <!-- Error Alert -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-1 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-1 opacity-0"
      >
        <div v-if="errorMessage" class="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-sm font-medium text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <UIcon name="i-lucide-alert-circle" class="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
          <span class="whitespace-pre-line leading-relaxed">{{ errorMessage }}</span>
        </div>
      </Transition>

      <form @submit.prevent="handleResetPassword" class="space-y-3.5 sm:space-y-4">
        <!-- New Password Field -->
        <div class="space-y-1.5 text-left">
          <label class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
            Новий пароль
          </label>
          <div class="relative flex items-center">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Мінімум 12 символів"
              required
              class="w-full bg-[#f8fafc] dark:bg-neutral-800/80 border border-[#e2e8f0] dark:border-neutral-700/80 rounded-xl pl-4 pr-11 py-2.5 sm:py-3 text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-800 transition-all"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-1 focus:outline-none transition-colors"
            >
              <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Confirm Password Field -->
        <div class="space-y-1.5 text-left">
          <label class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
            Підтвердження пароля
          </label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Повторіть новий пароль"
            required
            class="w-full bg-[#f8fafc] dark:bg-neutral-800/80 border border-[#e2e8f0] dark:border-neutral-700/80 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-800 transition-all"
          />
        </div>

        <!-- Submit Button -->
        <div class="pt-1.5">
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-[#181a20] dark:bg-white text-white dark:text-[#181a20] font-bold rounded-xl py-3.5 sm:py-4 text-sm sm:text-base hover:bg-[#272a34] dark:hover:bg-neutral-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <UIcon v-if="isLoading" name="i-lucide-loader-2" class="w-4.5 h-4.5 animate-spin" />
            <span>Зберегти новий пароль</span>
          </button>
        </div>
      </form>

      <!-- Footer Switch Link -->
      <div class="text-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-normal pt-1">
        Повернутися до
        <NuxtLink
          to="/auth/login"
          class="font-bold text-[#f05b5b] hover:underline ml-1"
        >
          Входу
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
