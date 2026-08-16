<script setup lang="ts">
import { computed } from 'vue'
import { useBilling } from '~/composables/useBilling'

const { isUpgradeModalOpen, upgradeModalFeature, activePlan } = useBilling()

const featureConfig = computed(() => {
  switch (upgradeModalFeature.value) {
    case 'chat':
      return {
        icon: 'i-lucide-sparkles',
        iconBg: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400',
        title: 'Досягнуто ліміт ШІ-запитів',
        description: 'Безкоштовний тариф дозволяє надсилати до 10 ШІ-запитів на день. Підвищте свій тариф, щоб розширити кулінарний діалог!',
        freeLimit: '10 запитів/день',
        proLimit: '50 запитів/день',
        premiumLimit: 'Безлімітно',
        accentColor: 'text-indigo-500'
      }
    case 'collections':
      return {
        icon: 'i-lucide-folder-heart',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400',
        title: 'Досягнуто ліміт колекцій',
        description: 'Ви використали максимальну кількість кулінарних колекцій для вашого тарифу. Час розширювати свою книгу рецептів!',
        freeLimit: '1 колекція',
        proLimit: '10 колекцій',
        premiumLimit: 'Безлімітно',
        accentColor: 'text-emerald-500'
      }
    case 'allergies':
      return {
        icon: 'i-lucide-shield-alert',
        iconBg: 'bg-rose-100 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400',
        title: 'Особисті дієти та алергени',
        description: 'Бажаєте отримувати розумні рекомендації без інгредієнтів-алергенів? Ця преміальна опція недоступна на безкоштовному тарифі.',
        freeLimit: 'Недоступно',
        proLimit: 'Увімкнено',
        premiumLimit: 'Увімкнено',
        accentColor: 'text-rose-500'
      }
  }
})

const handleUpgradeClick = () => {
  isUpgradeModalOpen.value = false
  navigateTo('/billing/plans')
}
</script>

<template>
  <UModal 
    v-model:open="isUpgradeModalOpen"
    :ui="{ 
      content: 'sm:max-w-md rounded-3xl border border-smak-neutral-100 dark:border-smak-neutral-800 bg-white/95 dark:bg-smak-neutral-900/95 backdrop-blur-xl shadow-2xl overflow-hidden'
    }"
  >
    <template #content>
      <!-- Premium Design Header Ribbon -->
      <div class="h-2 w-full bg-brand-gradient"></div>

      <div class="p-6 sm:p-8 space-y-6 text-center relative">
        <!-- Close Button (Nuxt UI v3 closes via model automatically, but let's make it intuitive) -->
        <button 
          @click="isUpgradeModalOpen = false" 
          class="absolute top-4 right-4 text-smak-neutral-400 hover:text-smak-neutral-600 dark:hover:text-white p-1.5 hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800 rounded-full transition-smooth focus:outline-none"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>

        <!-- Feature-specific Icon -->
        <div class="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xs transition-smooth hover:scale-110" :class="featureConfig.iconBg">
          <UIcon :name="featureConfig.icon" class="w-8 h-8" />
        </div>

        <!-- Typography -->
        <div class="space-y-2">
          <h3 class="text-xl sm:text-2xl font-display font-black text-smak-neutral-900 dark:text-white leading-tight">
            {{ featureConfig.title }}
          </h3>
          <p class="text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed px-2">
            {{ featureConfig.description }}
          </p>
        </div>

        <!-- Limits Comparison Box -->
        <div class="bg-smak-neutral-50/50 dark:bg-smak-neutral-800/30 rounded-2xl p-4 sm:p-5 border border-smak-neutral-100/50 dark:border-smak-neutral-800/40 text-left space-y-3.5">
          <span class="text-xs font-black uppercase tracking-wider text-smak-neutral-400 dark:text-smak-neutral-500">Порівняння лімітів:</span>
          
          <div class="space-y-2.5">
            <!-- Free -->
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="font-medium text-smak-neutral-500 dark:text-smak-neutral-400 flex items-center gap-1.5">
                <UIcon name="i-lucide-circle-dashed" class="w-4 h-4 opacity-50" />
                Тариф Free
              </span>
              <span class="font-black text-smak-neutral-700 dark:text-smak-neutral-300">
                {{ featureConfig.freeLimit }}
              </span>
            </div>
            
            <!-- Pro -->
            <div class="flex items-center justify-between text-xs sm:text-sm font-semibold text-coral-500">
              <span class="flex items-center gap-1.5">
                <UIcon name="i-lucide-award" class="w-4 h-4" />
                Тариф Pro
              </span>
              <span class="font-black">
                {{ featureConfig.proLimit }}
              </span>
            </div>

            <!-- Premium -->
            <div class="flex items-center justify-between text-xs sm:text-sm font-bold text-indigo-500 dark:text-indigo-400">
              <span class="flex items-center gap-1.5">
                <UIcon name="i-lucide-crown" class="w-4 h-4" />
                Тариф Premium
              </span>
              <span class="font-black">
                {{ featureConfig.premiumLimit }}
              </span>
            </div>
          </div>
        </div>

        <!-- Buttons Panel -->
        <div class="flex flex-col gap-2.5 pt-2">
          <UButton 
            class="justify-center py-3.5 rounded-xl font-bold bg-brand-gradient border-0 text-white shadow-md shadow-coral-500/25 hover:shadow-coral-500/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            @click="handleUpgradeClick"
          >
            <template #leading>
              <UIcon name="i-lucide-sparkles" class="w-4.5 h-4.5 text-yellow-200 animate-pulse" />
            </template>
            Оновити тарифний план
          </UButton>
          
          <UButton 
            variant="ghost" 
            color="neutral" 
            class="justify-center py-3 rounded-xl font-bold hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800 cursor-pointer"
            @click="isUpgradeModalOpen = false"
          >
            Продовжити пізніше
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
