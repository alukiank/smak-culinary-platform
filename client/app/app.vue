<script setup lang="ts">
import AppDemoNoticeModal from '~/components/shared/AppDemoNoticeModal.vue'
import AppToaster from '~/components/shared/AppToaster.vue'

const { initAuth } = useAuth()

await initAuth()
</script>

<template>
  <UApp :toaster="null">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToaster />
    <AppDemoNoticeModal />
  </UApp>
</template>
