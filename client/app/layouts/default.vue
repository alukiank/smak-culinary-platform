<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useColorMode } from '#imports'

const { user, logout } = useAuth()
const colorMode = useColorMode()
const route = useRoute()

const isFullWidth = computed(() => route.meta.fullWidth === true)

const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

const isMobileMenuOpen = ref(false)
const isProfileExpanded = ref(false)
const headerSearchQuery = ref('')

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleHeaderSearch = () => {
  if (headerSearchQuery.value.trim()) {
    navigateTo({ path: '/recipes', query: { query: headerSearchQuery.value.trim() } })
  }
}

const toggleProfileMenu = () => {
  isProfileExpanded.value = !isProfileExpanded.value
}

const userDisplayName = computed(() => user.value?.displayname || user.value?.username || 'Користувач')
const userEmail = computed(() => user.value?.email || '')
const userInitials = computed(() => userDisplayName.value.substring(0, 2).toUpperCase())

// Dropdown items for user menu
const dropdownItems = computed(() => {
  if (!user.value) return []
  
  const baseItems: any[][] = [
    [
      {
        label: userDisplayName.value,
        slot: 'profile-header',
        to: `/users/${user.value.id}`,
        class: 'w-full p-3! rounded-2xl! bg-smak-neutral-50/80! dark:bg-smak-neutral-800/40! transition-all duration-200 cursor-pointer group mb-1.5'
      }
    ],
    [
      {
        label: 'Мої налаштування',
        icon: 'i-lucide-settings',
        to: '/profile'
      },
      {
        label: 'Мої рецепти',
        icon: 'i-lucide-book-open',
        to: '/profile/recipes'
      },
      {
        label: 'Мої колекції',
        icon: 'i-lucide-folder-heart',
        to: '/profile/collections'
      },
      {
        label: 'Плани та тарифи',
        icon: 'i-lucide-credit-card',
        to: '/billing/plans'
      }
    ]
  ]

  // Add admin panel link if user is admin
  if (user.value.role === 'admin') {
    baseItems.push([
      {
        label: 'Панель адміністратора',
        icon: 'i-lucide-shield-check',
        to: '/admin/recipes'
      }
    ])
  }

  // Add logout
  baseItems.push([
    {
      label: 'Вийти з акаунту',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: () => {
        logout()
      }
    }
  ])

  return baseItems
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-smak-neutral-50 dark:bg-smak-neutral-950 text-smak-neutral-800 dark:text-smak-neutral-100 transition-colors duration-500">
    
    <!-- Minimalist Modern Header Section (Clean flex layout, no overlapping elements) -->
    <header class="sticky top-0 z-40 shrink-0 backdrop-blur-md border-b shadow-xs transition-all duration-500 bg-white/90 dark:bg-smak-neutral-900/90 border-smak-neutral-200/60 dark:border-smak-neutral-800/60">
      <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        
        <!-- Logo (Original SMAK Brand) -->
        <NuxtLink to="/" class="inline-flex items-end gap-2.5 group shrink-0 relative transition-transform duration-300 ease-out active:scale-95">
          <div class="relative w-9.5 h-9.5 sm:w-11 sm:h-11 flex items-end justify-center shrink-0">
            <div class="absolute -inset-1 rounded-full bg-gradient-to-r from-coral-500/30 to-amber-500/25 blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none transform-gpu scale-90 group-hover:scale-110"></div>
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              class="relative w-full h-full object-contain object-bottom transform-gpu transition-transform duration-500 ease-out group-hover:scale-105" 
            />
          </div>
          
          <span class="font-display font-black text-2xl sm:text-3xl tracking-tighter leading-none text-smak-neutral-900 dark:text-white group-hover:text-coral-500 transition-colors duration-300">
            SMAK
          </span>
        </NuxtLink>

        <!-- Desktop Navigation Links (Flex flow, responsive gap) -->
        <nav class="hidden md:flex items-center gap-4 lg:gap-6 shrink-0">
          <NuxtLink 
            to="/" 
            class="font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all relative py-2 text-smak-neutral-600 dark:text-smak-neutral-300 hover:text-coral-500 dark:hover:text-coral-400"
            active-class="text-smak-neutral-900! dark:text-white! font-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-coral-500 after:rounded-full"
            exact
          >
            ГОЛОВНА
          </NuxtLink>
          
          <NuxtLink 
            to="/recipes" 
            class="font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all relative py-2 text-smak-neutral-600 dark:text-smak-neutral-300 hover:text-coral-500 dark:hover:text-coral-400"
            active-class="text-smak-neutral-900! dark:text-white! font-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-coral-500 after:rounded-full"
          >
            РЕЦЕПТИ
          </NuxtLink>
          
          <NuxtLink 
            to="/chats" 
            class="font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all relative py-2 text-smak-neutral-600 dark:text-smak-neutral-300 hover:text-coral-500 dark:hover:text-coral-400"
            active-class="text-smak-neutral-900! dark:text-white! font-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-coral-500 after:rounded-full"
          >
            ШІ-ПОМІЧНИК
          </NuxtLink>
          
          <NuxtLink 
            to="/billing/plans" 
            class="font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all relative py-2 text-smak-neutral-600 dark:text-smak-neutral-300 hover:text-coral-500 dark:hover:text-coral-400"
            active-class="text-smak-neutral-900! dark:text-white! font-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-coral-500 after:rounded-full"
          >
            ТАРИФИ
          </NuxtLink>
        </nav>

        <!-- Right Side Controls (Search pill bar + Theme + Profile/Auth) -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <!-- Search Bar Input -->
          <form @submit.prevent="handleHeaderSearch" class="hidden xl:flex items-center relative">
            <input 
              v-model="headerSearchQuery"
              type="text" 
              placeholder="Пошук..." 
              class="w-36 xl:w-44 h-9 pl-4 pr-8 rounded-full text-xs sm:text-sm bg-smak-neutral-100 dark:bg-smak-neutral-800/80 border border-transparent focus:border-coral-500/60 focus:bg-white dark:focus:bg-smak-neutral-900 text-smak-neutral-900 dark:text-white placeholder:text-smak-neutral-400 focus:outline-none transition-all shadow-xs"
            />
            <button type="submit" class="absolute right-2.5 text-smak-neutral-400 hover:text-coral-500 transition-colors cursor-pointer" aria-label="Пошук">
              <UIcon name="i-lucide-search" class="w-3.5 h-3.5" />
            </button>
          </form>

          <!-- Theme Toggle -->
          <button 
            type="button"
            class="w-9 h-9 rounded-full flex items-center justify-center border border-smak-neutral-200 dark:border-smak-neutral-800 bg-transparent hover:border-coral-500 text-smak-neutral-700 dark:text-smak-neutral-300 hover:text-coral-500 transition-all cursor-pointer shrink-0"
            :aria-label="isDark ? 'Світла тема' : 'Темна тема'"
            @click="() => { isDark = !isDark }"
          >
            <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-4 h-4" />
          </button>

          <!-- User Profile Icon Menu / Authorization Buttons -->
          <div class="flex items-center shrink-0">
            <!-- Unauthorized User Buttons (Desktop Only) -->
            <div v-if="!user" class="hidden md:flex items-center gap-1.5 sm:gap-2">
              <NuxtLink 
                to="/auth/login" 
                class="inline-flex items-center justify-center px-3 py-1.5 rounded-full font-bold text-xs sm:text-sm text-smak-neutral-800 dark:text-smak-neutral-200 hover:text-coral-500 dark:hover:text-coral-400 transition-colors"
              >
                Увійти
              </NuxtLink>
              <NuxtLink 
                to="/auth/register" 
                class="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm bg-coral-500 hover:bg-coral-600 text-white shadow-md shadow-coral-500/25 transition-all duration-200 hover:scale-[1.04] active:scale-95 shrink-0"
              >
                <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
                <span>Авторизація</span>
              </NuxtLink>
            </div>

            <!-- Authorized User Menu Dropdown (Desktop Only) -->
            <div v-else class="hidden md:flex items-center gap-3">
              <UDropdownMenu 
                :items="dropdownItems"
                :ui="{ 
                  content: 'w-64 p-2 rounded-3xl border-0! ring-0! shadow-2xl bg-white dark:bg-smak-neutral-900 z-50',
                  separator: 'hidden! border-0!',
                  item: 'rounded-xl text-sm font-semibold transition-all hover:bg-transparent hover:text-coral-500 text-smak-neutral-800 dark:text-smak-neutral-200 p-2.5 cursor-pointer'
                }"
              >
                <button type="button" class="w-9 h-9 sm:w-10 sm:h-10 focus:outline-none rounded-full ring-2 ring-transparent hover:ring-coral-500 transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-center shrink-0">
                  <UAvatar :alt="userDisplayName" :label="userInitials" size="md" class="w-full h-full text-xs sm:text-sm bg-coral-100 text-coral-700 dark:bg-coral-900/40 dark:text-coral-300 font-black cursor-pointer" />
                </button>
                <template #profile-header>
                   <div class="flex items-center gap-3 w-full">
                     <UAvatar :alt="userDisplayName" :label="userInitials" size="md" class="bg-coral-100 text-coral-700 dark:bg-coral-900/40 dark:text-coral-300 font-bold shrink-0" />
                     <div class="flex flex-col text-left overflow-hidden">
                       <span class="font-heading font-extrabold text-sm truncate text-smak-neutral-900 dark:text-white group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors leading-tight">{{ userDisplayName }}</span>
                       <span class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 truncate mt-0.5">{{ userEmail }}</span>
                     </div>
                   </div>
                </template>
              </UDropdownMenu>
            </div>
          </div>

          <!-- Mobile Menu Hamburger -->
          <UButton 
            variant="ghost" 
            color="neutral" 
            class="md:hidden rounded-xl cursor-pointer" 
            @click="toggleMobileMenu"
          >
            <template #leading>
              <UIcon 
                :name="isMobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" 
                class="w-6 h-6 text-smak-neutral-800 dark:text-smak-neutral-200 transition-transform duration-200" 
              />
            </template>
          </UButton>
        </div>
      </div>

      <!-- Mobile Under-Header Dropdown Navigation Tray (Overlay) -->
      <Transition name="slide-down-menu">
        <div 
          v-if="isMobileMenuOpen" 
          class="md:hidden absolute top-full left-0 right-0 z-50 bg-white/95 dark:bg-smak-neutral-900/95 backdrop-blur-xl border-b border-smak-neutral-200/80 dark:border-smak-neutral-800 shadow-2xl transition-all duration-300"
        >
          <!-- 1. PC-Style Navigation Links Bar (Screen 1) -->
          <div class="flex items-center justify-around sm:justify-start gap-4 px-4 py-3 border-b border-smak-neutral-100 dark:border-smak-neutral-800/80">
            <NuxtLink 
              to="/" 
              class="font-heading font-extrabold text-xs uppercase tracking-wider py-2 relative transition-all text-smak-neutral-600 dark:text-smak-neutral-300 hover:text-coral-500 shrink-0"
              active-class="text-smak-neutral-900! dark:text-white! font-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-coral-500 after:rounded-full"
              exact
              @click="isMobileMenuOpen = false"
            >
              ГОЛОВНА
            </NuxtLink>
            
            <NuxtLink 
              to="/recipes" 
              class="font-heading font-extrabold text-xs uppercase tracking-wider py-2 relative transition-all text-smak-neutral-600 dark:text-smak-neutral-300 hover:text-coral-500 shrink-0"
              active-class="text-smak-neutral-900! dark:text-white! font-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-coral-500 after:rounded-full"
              @click="isMobileMenuOpen = false"
            >
              РЕЦЕПТИ
            </NuxtLink>
            
            <NuxtLink 
              to="/chats" 
              class="font-heading font-extrabold text-xs uppercase tracking-wider py-2 relative transition-all text-smak-neutral-600 dark:text-smak-neutral-300 hover:text-coral-500 shrink-0"
              active-class="text-smak-neutral-900! dark:text-white! font-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-coral-500 after:rounded-full"
              @click="isMobileMenuOpen = false"
            >
              ШІ-ПОМІЧНИК
            </NuxtLink>
            
            <NuxtLink 
              to="/billing/plans" 
              class="font-heading font-extrabold text-xs uppercase tracking-wider py-2 relative transition-all text-smak-neutral-600 dark:text-smak-neutral-300 hover:text-coral-500 shrink-0"
              active-class="text-smak-neutral-900! dark:text-white! font-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-coral-500 after:rounded-full"
              @click="isMobileMenuOpen = false"
            >
              ТАРИФИ
            </NuxtLink>
          </div>

          <!-- 2. User & Personal Navigation (Compact Layout) -->
          <div class="p-3.5 space-y-2.5">
            <template v-if="user">
              <!-- User Profile Strip with Settings & Logout Icons (Enlarged Text) -->
              <div class="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-smak-neutral-50 dark:bg-smak-neutral-800/50 border border-smak-neutral-100 dark:border-smak-neutral-800">
                <NuxtLink 
                  :to="`/users/${user.id}`" 
                  class="flex items-center gap-3 min-w-0 flex-1 p-1 rounded-xl hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 transition-colors"
                  @click="isMobileMenuOpen = false"
                >
                  <UAvatar :alt="userDisplayName" :label="userInitials" size="md" class="bg-coral-100 text-coral-700 dark:bg-coral-900/40 dark:text-coral-300 font-bold shrink-0 text-xs" />
                  <div class="flex flex-col min-w-0 text-left">
                    <span class="font-heading font-bold text-sm sm:text-base truncate text-smak-neutral-900 dark:text-white leading-tight">{{ userDisplayName }}</span>
                    <span class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 truncate mt-0.5">{{ userEmail }}</span>
                  </div>
                </NuxtLink>

                <div class="flex items-center gap-1.5 shrink-0">
                  <NuxtLink 
                    to="/profile" 
                    class="p-2 rounded-xl text-smak-neutral-600 dark:text-smak-neutral-400 hover:text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-950/30 transition-colors"
                    title="Мої налаштування"
                    @click="isMobileMenuOpen = false"
                  >
                    <UIcon name="i-lucide-settings" class="w-5 h-5" />
                  </NuxtLink>
                  <button 
                    @click="() => { logout(); isMobileMenuOpen = false; }" 
                    class="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Вийти з акаунту"
                  >
                    <UIcon name="i-lucide-log-out" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Compact 2-Column Grid for Remaining Buttons (Enlarged Text) -->
              <div class="grid grid-cols-2 gap-2.5">
                <NuxtLink 
                  to="/profile/recipes" 
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-smak-neutral-50 dark:bg-smak-neutral-800/50 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 text-smak-neutral-800 dark:text-smak-neutral-200 hover:text-coral-500 transition-all border border-smak-neutral-100 dark:border-smak-neutral-800"
                  @click="isMobileMenuOpen = false"
                >
                  <UIcon name="i-lucide-book-open" class="w-4.5 h-4.5 text-coral-500 shrink-0" />
                  <span class="truncate">Мої рецепти</span>
                </NuxtLink>

                <NuxtLink 
                  to="/profile/collections" 
                  class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-smak-neutral-50 dark:bg-smak-neutral-800/50 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 text-smak-neutral-800 dark:text-smak-neutral-200 hover:text-coral-500 transition-all border border-smak-neutral-100 dark:border-smak-neutral-800"
                  @click="isMobileMenuOpen = false"
                >
                  <UIcon name="i-lucide-folder-heart" class="w-4.5 h-4.5 text-coral-500 shrink-0" />
                  <span class="truncate">Мої колекції</span>
                </NuxtLink>

                <NuxtLink 
                  v-if="user.role === 'admin'"
                  to="/admin/recipes" 
                  class="col-span-2 flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all border border-amber-500/20"
                  @click="isMobileMenuOpen = false"
                >
                  <UIcon name="i-lucide-shield-check" class="w-4.5 h-4.5 text-amber-500 shrink-0" />
                  <span class="truncate">Панель адміністратора</span>
                </NuxtLink>
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col gap-2 pt-1">
                <NuxtLink 
                  to="/auth/login" 
                  class="w-full justify-center inline-flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-coral-500 hover:bg-coral-600 text-white shadow-xs transition-all cursor-pointer"
                  @click="isMobileMenuOpen = false"
                >
                  <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
                  <span>Увійти в акаунт</span>
                </NuxtLink>
                <NuxtLink 
                  to="/auth/register" 
                  class="w-full justify-center inline-flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs border border-smak-neutral-200 dark:border-smak-neutral-700 text-smak-neutral-800 dark:text-smak-neutral-200 hover:border-coral-500 transition-all cursor-pointer"
                  @click="isMobileMenuOpen = false"
                >
                  <span>Зареєструватися</span>
                </NuxtLink>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </header>

    <!-- Main Content and Scroll Area -->
    <div id="main-scroll-container" class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth relative z-10 custom-scrollbar">
      <!-- Content Wrapper -->
      <main 
        class="w-full flex-1"
        :class="[isFullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12']"
      >
        <slot />
      </main>

      <!-- Premium Footer Section -->
      <footer class="bg-white/95 dark:bg-smak-neutral-900/95 backdrop-blur-xl border-t border-smak-neutral-100 dark:border-smak-neutral-800/60 transition-colors duration-500 mt-auto z-20">
        <!-- Top Footer Grid -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
            
            <!-- Brand Column -->
            <div class="lg:col-span-4 flex flex-col gap-5">
              <NuxtLink to="/" class="inline-flex items-end gap-3.5 group shrink-0 relative w-fit">
                <!-- Logo Image with smooth ambient glow -->
                <div class="relative w-11 h-11 flex items-end justify-center shrink-0">
                  <div class="absolute -inset-1 rounded-full bg-gradient-to-r from-coral-500/30 to-amber-500/25 blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none transform-gpu scale-90 group-hover:scale-110"></div>
                  <img 
                    src="/images/logo.png" 
                    alt="Logo" 
                    class="relative w-full h-full object-contain object-bottom transform-gpu transition-transform duration-500 ease-out group-hover:scale-105" 
                  />
                </div>
                
                <!-- Brand Name -->
                <span class="font-display font-black text-2xl tracking-tighter leading-none text-smak-neutral-900 dark:text-white group-hover:text-coral-500 dark:group-hover:text-coral-400 transition-colors duration-300">
                  SMAK
                </span>
              </NuxtLink>
              
              <p class="text-sm text-smak-neutral-600 dark:text-smak-neutral-300 max-w-sm leading-relaxed font-medium">
                Ваш розумний ШІ-помічник у світі кулінарії. Створюйте шедеври, плануйте збалансоване меню та відкривайте нові смаки щодня разом з нами.
              </p>
              
              <!-- Social Media Icons -->
              <div class="flex items-center gap-3 mt-1">
                <a 
                  href="#" 
                  class="w-10 h-10 rounded-xl flex items-center justify-center border border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-300 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 hover:text-coral-500 dark:hover:text-coral-400 hover:border-coral-200 dark:hover:border-coral-900/50 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <UIcon name="i-lucide-instagram" class="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  class="w-10 h-10 rounded-xl flex items-center justify-center border border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-300 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 hover:text-coral-500 dark:hover:text-coral-400 hover:border-coral-200 dark:hover:border-coral-900/50 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <UIcon name="i-lucide-facebook" class="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  class="w-10 h-10 rounded-xl flex items-center justify-center border border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-300 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 hover:text-coral-500 dark:hover:text-coral-400 hover:border-coral-200 dark:hover:border-coral-900/50 transition-all duration-300"
                  aria-label="Telegram"
                >
                  <UIcon name="i-lucide-send" class="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  class="w-10 h-10 rounded-xl flex items-center justify-center border border-smak-neutral-200 dark:border-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-300 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 hover:text-coral-500 dark:hover:text-coral-400 hover:border-coral-200 dark:hover:border-coral-900/50 transition-all duration-300"
                  aria-label="YouTube"
                >
                  <UIcon name="i-lucide-youtube" class="w-5 h-5" />
                </a>
              </div>
            </div>

            <!-- Links Columns -->
            <div class="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 items-start">
              <!-- Navigation Column 1 -->
              <div class="flex flex-col gap-4">
                <span class="font-heading font-bold text-xs tracking-wider text-smak-neutral-900 dark:text-white uppercase">
                  Основне
                </span>
                <ul class="flex flex-col gap-3 text-sm font-semibold">
                  <li>
                    <NuxtLink to="/recipes" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      Рецепти
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/chats" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      ШІ-помічник
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/billing/plans" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      Тарифи та плани
                    </NuxtLink>
                  </li>
                </ul>
              </div>

              <!-- Navigation Column 2 -->
              <div class="flex flex-col gap-4">
                <span class="font-heading font-bold text-xs tracking-wider text-smak-neutral-900 dark:text-white uppercase">
                  Особистий кабінет
                </span>
                <ul class="flex flex-col gap-3 text-sm font-semibold">
                  <li>
                    <NuxtLink to="/profile" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      Мій профіль
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/profile/recipes" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      Мої рецепти
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/profile/collections" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      Мої колекції
                    </NuxtLink>
                  </li>
                </ul>
              </div>

              <!-- Navigation Column 3 -->
              <div class="flex flex-col gap-4 col-span-2 sm:col-span-1">
                <span class="font-heading font-bold text-xs tracking-wider text-smak-neutral-900 dark:text-white uppercase">
                  Підтримка та умови
                </span>
                <ul class="flex flex-col gap-3 text-sm font-semibold">
                  <li>
                    <NuxtLink to="/rules" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      Правила користування
                    </NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/privacy" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      Конфіденційність
                    </NuxtLink>
                  </li>
                  <li>
                    <a href="mailto:support@smak.ai" class="text-smak-neutral-500 hover:text-coral-500 dark:text-smak-neutral-400 dark:hover:text-coral-400 transition-colors flex items-center gap-1.5 group">
                      <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-coral-500" />
                      Напишіть нам
                    </a>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        <!-- Divider line -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-smak-neutral-100 dark:border-smak-neutral-800/40"></div>

        <!-- Bottom Copyright strip -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-smak-neutral-400 dark:text-smak-neutral-500 font-medium">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>&copy; {{ new Date().getFullYear() }} SMAK. Всі права захищено.</span>
          </div>
          <span class="flex items-center gap-1.5 font-medium">Зроблено з любов'ю до Вас <UIcon name="i-lucide-heart" class="w-4 h-4 text-coral-500 animate-pulse" /></span>
        </div>
      </footer>
    </div>

    <!-- Backdrop Overlay for Under-Header Mobile Menu -->
    <Transition name="fade-overlay">
      <div 
        v-if="isMobileMenuOpen" 
        class="fixed inset-0 top-16 sm:top-20 bg-black/60 backdrop-blur-xs z-30 md:hidden" 
        @click="isMobileMenuOpen = false"
      ></div>
    </Transition>
    
  </div>
</template>

<style scoped>
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-menu-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-menu-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-menu-enter-from,
.slide-down-menu-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
.slide-down-menu-enter-to,
.slide-down-menu-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
</style>
