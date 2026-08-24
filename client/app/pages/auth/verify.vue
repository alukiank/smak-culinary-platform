<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Smak | Підтвердження пошти'
})

const { verifyEmail, resendVerificationEmail } = useAuth()
const route = useRoute()
const toast = useToast()

const tokenParam = computed(() => (route.query.token as string) || '')
const isVerifying = ref(true)
const isSuccess = ref(false)
const errorMessage = ref('')
const isResending = ref(false)

onMounted(async () => {
  if (!tokenParam.value) {
    isVerifying.value = false
    errorMessage.value = 'Токен підтвердження відсутній або некоректний.'
    return
  }

  isVerifying.value = true
  errorMessage.value = ''

  const res = await verifyEmail(tokenParam.value)
  isVerifying.value = false

  if (res.success) {
    isSuccess.value = true
    toast.add({
      title: 'Email підтверджено!',
      description: 'Ваш обліковий запис тепер успішно активовано.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } else {
    errorMessage.value = res.error || 'Не вдалося підтвердити email. Можливо, посилання застаріло або вже було використане.'
    toast.add({
      title: 'Помилка підтвердження',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
})

const handleResendEmail = async () => {
  isResending.value = true
  const res = await resendVerificationEmail()
  isResending.value = false

  if (res.success) {
    toast.add({
      title: 'Лист надіслано!',
      description: 'Новий лист із посиланням надіслано на вашу електронну пошту.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } else {
    toast.add({
      title: 'Помилка надсилання',
      description: res.error || 'Не вдалося надіслати повторний лист.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- State 1: Verifying Spinner -->
    <div v-if="isVerifying" class="py-6 space-y-4 text-center">
      <div class="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto animate-pulse">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>
      <div class="space-y-1.5">
        <h3 class="text-2xl font-bold font-heading text-neutral-900 dark:text-white">Перевірка посилання...</h3>
        <p class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal">
          Будь ласка, зачекайте. Ми підтверджуємо ваш email у системі...
        </p>
      </div>
    </div>

    <!-- State 2: Verification Success -->
    <div v-else-if="isSuccess" class="py-3 space-y-4 text-center">
      <div class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-check-circle" class="w-8 h-8" />
      </div>
      <div class="space-y-1.5">
        <h3 class="text-2xl font-bold font-heading text-neutral-900 dark:text-white">Email підтверджено!</h3>
        <p class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
          Вітаємо! Ваш профіль активовано. Тепер вам доступні всі можливості платформи SMAK.
        </p>
      </div>
      <div class="space-y-3 pt-2">
        <NuxtLink
          to="/"
          class="w-full bg-[#181a20] dark:bg-white text-white dark:text-[#181a20] font-bold rounded-xl py-3.5 sm:py-4 text-sm sm:text-base hover:bg-[#272a34] dark:hover:bg-neutral-100 transition-all duration-200 shadow-sm block text-center"
        >
          Перейти на головну
        </NuxtLink>
        <NuxtLink
          to="/profile"
          class="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-xl py-3 text-xs sm:text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all block text-center"
        >
          Перейти до профілю
        </NuxtLink>
      </div>
    </div>

    <!-- State 3: Error / Expired -->
    <div v-else class="py-3 space-y-4 text-center">
      <div class="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-alert-circle" class="w-8 h-8" />
      </div>
      <div class="space-y-1.5">
        <h3 class="text-2xl font-bold font-heading text-neutral-900 dark:text-white">Помилка підтвердження</h3>
        <p class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal whitespace-pre-line">
          {{ errorMessage }}
        </p>
      </div>
      <div class="space-y-3 pt-2">
        <button
          type="button"
          @click="handleResendEmail"
          :disabled="isResending"
          class="w-full bg-[#181a20] dark:bg-white text-white dark:text-[#181a20] font-bold rounded-xl py-3.5 sm:py-4 text-sm sm:text-base hover:bg-[#272a34] dark:hover:bg-neutral-100 transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <UIcon v-if="isResending" name="i-lucide-loader-2" class="w-4.5 h-4.5 animate-spin" />
          <span>Надіслати лист повторно</span>
        </button>
        <NuxtLink
          to="/auth/login"
          class="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-xl py-3 text-xs sm:text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all block text-center"
        >
          Повернутися до входу
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
