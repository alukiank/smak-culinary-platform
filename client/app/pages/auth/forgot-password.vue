<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Smak | Відновлення пароля'
})

const { forgotPassword } = useAuth()
const toast = useToast()

const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const isSuccess = ref(false)

const handleForgotPassword = async () => {
  if (!email.value) {
    errorMessage.value = 'Будь ласка, вкажіть ваш email'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  const res = await forgotPassword(email.value)
  isLoading.value = false

  if (res.success) {
    isSuccess.value = true
    toast.add({
      title: 'Лист надіслано!',
      description: 'Інструкції для скидання пароля надіслано на вашу пошту.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } else {
    errorMessage.value = res.error || 'Користувача з таким email не знайдено'
    toast.add({
      title: 'Помилка запиту',
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
        Забули пароль?
      </h1>
      <p class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal">
        Введіть вашу пошту для отримання посилання скидання пароля
      </p>
    </div>

    <!-- Success View -->
    <div v-if="isSuccess" class="text-center space-y-4 py-3">
      <div class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-check-circle" class="w-8 h-8" />
      </div>
      <div class="space-y-1.5">
        <h3 class="text-lg font-bold text-neutral-900 dark:text-white">Лист надіслано!</h3>
        <p class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
          Інструкції скидання пароля надіслано на <strong class="text-neutral-900 dark:text-white font-semibold">{{ email }}</strong>.
        </p>
      </div>
      <NuxtLink
        to="/auth/login"
        class="w-full bg-[#181a20] dark:bg-white text-white dark:text-[#181a20] font-bold rounded-xl py-3.5 sm:py-4 text-sm sm:text-base hover:bg-[#272a34] dark:hover:bg-neutral-100 transition-all duration-200 shadow-sm block text-center mt-2"
      >
        Повернутися до входу
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
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <form @submit.prevent="handleForgotPassword" class="space-y-3.5 sm:space-y-4">
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

        <!-- Submit Button -->
        <div class="pt-1.5">
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-[#181a20] dark:bg-white text-white dark:text-[#181a20] font-bold rounded-xl py-3.5 sm:py-4 text-sm sm:text-base hover:bg-[#272a34] dark:hover:bg-neutral-100 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <UIcon v-if="isLoading" name="i-lucide-loader-2" class="w-4.5 h-4.5 animate-spin" />
            <span>Надіслати інструкції</span>
          </button>
        </div>
      </form>

      <!-- Footer Switch Link -->
      <div class="text-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-normal pt-1">
        Згадали пароль?
        <NuxtLink
          to="/auth/login"
          class="font-bold text-[#f05b5b] hover:underline ml-1"
        >
          Увійти
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
