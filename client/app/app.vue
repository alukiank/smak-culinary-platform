<script setup lang="ts">
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
  </UApp>
</template>
