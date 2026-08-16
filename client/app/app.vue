<script setup lang="ts">
const { initAuth } = useAuth()

await initAuth()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
