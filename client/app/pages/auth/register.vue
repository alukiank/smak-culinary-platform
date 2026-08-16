<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Smak | Реєстрація'
})

const { register, user } = useAuth()
const toast = useToast()

// Redirection safeguard
onMounted(() => {
  if (user.value) {
    navigateTo('/')
  }
})

const username = ref('')
const displayname = ref('')
const email = ref('')
const password = ref('')
const acceptTerms = ref(true)
const isLoading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  if (!username.value || !displayname.value || !email.value || !password.value) {
    errorMessage.value = 'Будь ласка, заповніть усі обов’язкові поля'
    return
  }

  if (!acceptTerms.value) {
    errorMessage.value = 'Необхідно погодитися з Угодою користувача'
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

  const res = await register(username.value, displayname.value, email.value, password.value)
  isLoading.value = false

  if (res.success) {
    toast.add({
      title: 'Реєстрація успішна!',
      description: 'Ваш акаунт створено. Перевірте пошту для підтвердження email!',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    navigateTo('/')
  } else {
    errorMessage.value = res.error || 'Помилка реєстрації. Можливо, такий email або нікнейм уже зайняті'
    toast.add({
      title: 'Помилка реєстрації',
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
        Створення акаунту
      </h1>
      <p class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal">
        Заповніть дані для реєстрації кулінарного профілю SMAK
      </p>
    </div>

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
        <span>{{ errorMessage }}</span>
      </div>
    </Transition>

    <!-- Registration Form -->
    <form @submit.prevent="handleRegister" class="space-y-3.5 sm:space-y-4">
      <!-- 2-Column: Username & Display Name -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div class="space-y-1.5 text-left">
          <label class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
            Нікнейм
          </label>
          <input
            v-model="username"
            type="text"
            placeholder="chef_master"
            required
            class="w-full bg-[#f8fafc] dark:bg-neutral-800/80 border border-[#e2e8f0] dark:border-neutral-700/80 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-800 transition-all"
          />
        </div>

        <div class="space-y-1.5 text-left">
          <label class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
            Ім'я та прізвище
          </label>
          <input
            v-model="displayname"
            type="text"
            placeholder="Олександр Коваль"
            required
            class="w-full bg-[#f8fafc] dark:bg-neutral-800/80 border border-[#e2e8f0] dark:border-neutral-700/80 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-800 transition-all"
          />
        </div>
      </div>

      <!-- Email Field -->
      <div class="space-y-1.5 text-left">
        <label class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
          Електронна пошта
        </label>
        <input
          v-model="email"
          type="email"
          placeholder="vlad@smak.ua"
          required
          class="w-full bg-[#f8fafc] dark:bg-neutral-800/80 border border-[#e2e8f0] dark:border-neutral-700/80 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-800 transition-all"
        />
      </div>

      <!-- Password Field -->
      <div class="space-y-1.5 text-left">
        <label class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
          Пароль
        </label>
        <div class="relative flex items-center">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Мін. 12 символів (літери, цифри, спецсимвол)"
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

      <!-- Agreement Checkbox -->
      <div class="pt-1 text-left">
        <label class="flex items-start gap-2.5 cursor-pointer text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm select-none">
          <input
            type="checkbox"
            v-model="acceptTerms"
            required
            class="w-4.5 h-4.5 mt-0.5 rounded border-neutral-300 dark:border-neutral-700 text-[#f05b5b] focus:ring-[#f05b5b] cursor-pointer shrink-0"
          />
          <span class="leading-snug">
            Я погоджуюся з
            <NuxtLink to="/terms" target="_blank" class="text-[#f05b5b] hover:underline font-semibold">Угодою користувача</NuxtLink>
            та
            <NuxtLink to="/privacy" target="_blank" class="text-[#f05b5b] hover:underline font-semibold">Політикою конфіденційності</NuxtLink>
          </span>
        </label>
      </div>

      <!-- Submit Button -->
      <div class="pt-1.5">
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-[#181a20] dark:bg-white text-white dark:text-[#181a20] font-bold rounded-xl py-3.5 sm:py-4 text-sm sm:text-base hover:bg-[#272a34] dark:hover:bg-neutral-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          <UIcon v-if="isLoading" name="i-lucide-loader-2" class="w-4.5 h-4.5 animate-spin" />
          <span>Створити акаунт</span>
        </button>
      </div>
    </form>

    <!-- Footer Switch Link -->
    <div class="text-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-normal pt-1">
      Вже маєте акаунт?
      <NuxtLink
        to="/auth/login"
        class="font-bold text-[#f05b5b] hover:underline ml-1"
      >
        Увійти
      </NuxtLink>
    </div>
  </div>
</template>
