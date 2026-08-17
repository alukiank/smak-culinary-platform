<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useColorMode } from '#imports'

const colorMode = useColorMode()
const route = useRoute()

const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

// Variable food photography pool
const foodImages = [
  '/images/auth_slide_2.png',
  '/images/food_ingredients_banner.png',
  '/images/pexels-dhiraj-jain-207743066-12737657.jpg',
  '/images/smak-auth-food-banner.jpg',
  '/images/pexels-numangilgil-19917465.jpg'
]

const currentImageIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

// Select initial image based on route
onMounted(() => {
  if (route.path.includes('/register')) {
    currentImageIndex.value = 1
  } else if (route.path.includes('/forgot-password') || route.path.includes('/reset-password')) {
    currentImageIndex.value = 2
  } else if (route.path.includes('/verify')) {
    currentImageIndex.value = 3
  } else {
    currentImageIndex.value = 0
  }

  // Auto rotate photo every 7 seconds
  timer = setInterval(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % foodImages.length
  }, 7000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Dynamic quote text in Ukrainian
const bannerQuote = computed(() => {
  if (route.path.includes('/register')) {
    return {
      title: 'Створюйте та Діліться Рецептами',
      text: 'Приєднуйтесь до тисяч кулінарів, зберігайте улюблені страви та відкривайте нові смакові поєднання.'
    }
  }
  if (route.path.includes('/forgot-password') || route.path.includes('/reset-password')) {
    return {
      title: 'Відновлення Доступу',
      text: 'Ми допоможемо вам швидко відновити доступ до вашої персональної кулінарної книги.'
    }
  }
  if (route.path.includes('/verify')) {
    return {
      title: 'Активація Профілю',
      text: 'Підтвердіть електронну пошту для активації повного доступу до преміум-функцій SMAK.'
    }
  }
  return {
    title: 'Відкрийте Світ Неперевершених Смаків',
    text: 'Кожен рецепт — це історія, створена з любов\'ю. Готуйте з натхненням та довіряйте власному смаку.'
  }
})
</script>

<template>
  <div class="min-h-screen w-full bg-white sm:bg-smak-neutral-100 dark:bg-smak-neutral-950 text-smak-neutral-900 dark:text-smak-neutral-100 flex items-center justify-center p-0 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden selection:bg-coral-500 selection:text-white transition-colors duration-500">
    <!-- Ambient glowing backdrops adapting to light/dark mode (desktop only) -->
    <div class="hidden sm:block absolute -top-40 -left-40 w-150 h-150 bg-linear-to-tr from-coral-500/20 via-orange-500/15 to-yellow-500/10 dark:from-coral-500/25 dark:via-pink-500/20 dark:to-cyan-500/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" style="animation-duration: 9s;"></div>
    <div class="hidden sm:block absolute -bottom-40 -right-40 w-150 h-150 bg-linear-to-br from-coral-600/20 via-orange-600/15 to-transparent dark:from-coral-600/25 dark:via-orange-600/15 rounded-full blur-[140px] pointer-events-none -z-10"></div>

    <!-- Main Card Container (Full bleed on mobile with no frame/border/shadow, floating card on desktop) -->
    <div class="w-full max-w-5xl min-h-screen sm:min-h-auto rounded-none sm:rounded-4xl overflow-hidden bg-white dark:bg-smak-neutral-900 border-0 sm:border border-smak-neutral-200 dark:border-smak-neutral-800 shadow-none sm:shadow-2xl relative z-10 transition-all duration-300 flex flex-col justify-center">
      <div class="grid grid-cols-1 lg:grid-cols-12 min-h-screen sm:min-h-145 lg:min-h-165">
        
        <!-- Left Side: Dark Culinary Photo Banner (Fills left column completely on desktop) -->
        <div class="hidden lg:flex lg:col-span-5 relative flex-col justify-end p-8 sm:p-10 bg-smak-neutral-950 text-white select-none group">
          
          <!-- Variable Food Image background with crossfade effect -->
          <div class="absolute inset-0 z-0">
            <TransitionGroup name="fade">
              <img 
                v-for="(img, idx) in foodImages"
                :key="img"
                v-show="idx === currentImageIndex"
                :src="img" 
                alt="Smak Culinary Art" 
                class="absolute inset-0 w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out"
              />
            </TransitionGroup>
            <!-- Dark overlay for legibility -->
            <div class="absolute inset-0 bg-linear-to-t from-smak-neutral-950 via-smak-neutral-950/65 to-smak-neutral-950/20"></div>
          </div>

          <!-- Photo Pagination Dots at Top Left (No top text labels!) -->
          <div class="absolute top-6 left-8 z-10 flex items-center gap-1.5">
            <button
              v-for="(_, i) in foodImages"
              :key="i"
              @click="currentImageIndex = i"
              type="button"
              class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              :class="i === currentImageIndex ? 'w-6 bg-coral-500' : 'w-1.5 bg-white/40 hover:bg-white/70'"
              :aria-label="`Slide ${i + 1}`"
            ></button>
          </div>

          <!-- Bottom Quote & Title Section (No top text above photo!) -->
          <div class="relative z-10 space-y-3 max-w-md">
            <h2 class="text-2xl xl:text-3xl font-extrabold font-heading tracking-tight leading-[1.2] text-white">
              {{ bannerQuote.title }}
            </h2>
            <p class="text-sm text-smak-neutral-300 font-normal leading-relaxed">
              {{ bannerQuote.text }}
            </p>
          </div>
        </div>

        <!-- Right Side: Clean Form Container (Full height & width on mobile) -->
        <div class="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 md:p-12 relative bg-white dark:bg-smak-neutral-900 transition-colors duration-300 min-h-screen sm:min-h-auto">
          
          <!-- Top Header: Logo Centered (Matching default header dimensions) -->
          <div class="flex items-center justify-center w-full mb-6 sm:mb-8">
            <NuxtLink to="/" class="inline-flex items-end gap-2.5 group shrink-0 relative">
              <div class="relative w-9.5 h-9.5 sm:w-11 sm:h-11 flex items-end justify-center shrink-0">
                <div class="absolute -inset-1 rounded-full bg-gradient-to-r from-coral-500/30 to-amber-500/25 blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none transform-gpu scale-90 group-hover:scale-110"></div>
                <img 
                  src="/images/logo.png" 
                  alt="SMAK Logo" 
                  class="relative w-full h-full object-contain object-bottom transform-gpu transition-transform duration-500 ease-out group-hover:scale-105" 
                />
              </div>
              <span class="font-display font-black text-2xl sm:text-3xl tracking-tighter leading-none text-smak-neutral-900 dark:text-white group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors duration-300">
                SMAK
              </span>
            </NuxtLink>
          </div>

          <!-- Page Content Slot -->
          <div class="my-auto w-full max-w-md mx-auto py-2">
            <slot />
          </div>

          <!-- Footer Copyright Notice -->
          <div class="mt-8 text-center text-xs text-smak-neutral-400 dark:text-smak-neutral-500">
            © {{ new Date().getFullYear() }} SMAK Culinary Platform. Всі права захищено.
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
