<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

const navItems = [
  {
    label: 'Дашборд',
    icon: 'i-lucide-layout-dashboard',
    to: '/admin'
  },
  {
    label: 'Модерація',
    icon: 'i-lucide-shield-check',
    to: '/admin/moderation'
  },
  {
    label: 'Рецепти',
    icon: 'i-lucide-cooking-pot',
    to: '/admin/recipes'
  },
  {
    label: 'Користувачі',
    icon: 'i-lucide-users',
    to: '/admin/users'
  },
  {
    label: 'Білінг',
    icon: 'i-lucide-credit-card',
    to: '/admin/billing'
  }
]

const { user, logout } = useAuth()

const userDisplayName = computed(() => user.value?.displayname || user.value?.username || 'Адміністратор')
const userEmail = computed(() => user.value?.email || 'admin@example.com')
const userInitials = computed(() => userDisplayName.value.substring(0, 2).toUpperCase())

const handleLogout = async () => {
  await logout()
}

const colorMode = useColorMode()
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="flex h-screen bg-smak-neutral-50 dark:bg-smak-neutral-950 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-smak-neutral-200 dark:border-smak-neutral-800 bg-white dark:bg-smak-neutral-900 flex flex-col">
      <!-- Logo -->
      <NuxtLink to="/" class="h-16 px-6 flex items-center gap-3 border-b border-smak-neutral-200 dark:border-smak-neutral-800 group transition-smooth">
        <img 
          src="/images/logo.png" 
          alt="Logo" 
          class="w-8 h-8 object-contain transition-all duration-500 group-hover:scale-110 filter drop-shadow-[0_0_6px_rgba(240,91,91,0.2)] group-hover:drop-shadow-[0_0_12px_rgba(240,91,91,0.5)]" 
        />
        <span class="font-display font-bold text-xl text-coral-600 dark:text-coral-400 group-hover:text-coral-500 dark:group-hover:text-coral-300 transition-colors duration-300">
          Smak Admin
        </span>
      </NuxtLink>
      
      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-smak-neutral-600 dark:text-smak-neutral-400 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 hover:text-smak-neutral-900 dark:hover:text-white transition-smooth"
          active-class="bg-coral-50 dark:bg-coral-950/30 text-coral-600 dark:text-coral-400 font-semibold"
        >
          <UIcon :name="item.icon" class="text-lg" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      
      <!-- User Profile & Footer -->
      <div class="p-4 border-t border-smak-neutral-200 dark:border-smak-neutral-800">
        <div class="flex items-center gap-2 p-2 rounded-lg bg-smak-neutral-50 dark:bg-smak-neutral-800/50">
          <NuxtLink to="/" class="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <UAvatar :alt="userDisplayName" :label="userInitials" size="sm" class="bg-coral-100 text-coral-700 dark:bg-coral-900/40 dark:text-coral-300 font-bold" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-smak-neutral-900 dark:text-white truncate">{{ userDisplayName }}</p>
              <p class="text-xs text-smak-neutral-500 truncate">{{ userEmail }}</p>
            </div>
          </NuxtLink>
          <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" size="xs" @click="handleLogout" title="Вийти" />
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 border-b border-smak-neutral-200 dark:border-smak-neutral-800 bg-white dark:bg-smak-neutral-900 flex items-center justify-between px-6">
        <div class="flex items-center gap-4">
          <h1 class="font-heading font-semibold text-lg text-smak-neutral-900 dark:text-white">Панель керування</h1>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Theme Toggle -->
          <UButton
            color="neutral"
            variant="ghost"
            :icon="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
            @click="toggleColorMode"
          />

          
          <!-- View Site -->
          <UButton to="/" target="_blank" color="coral" variant="solid" size="sm" icon="i-lucide-external-link">
            На сайт
          </UButton>
        </div>
      </header>

      <!-- Page Content -->
      <main id="main-scroll-container" class="flex-1 overflow-y-auto p-6 bg-smak-neutral-50 dark:bg-smak-neutral-950">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles if needed */
</style>
