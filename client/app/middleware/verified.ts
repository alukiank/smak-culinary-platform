export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isLoggedIn, user, initAuth } = useAuth()

  await initAuth()

  if (!isLoggedIn.value) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
  }

  if (!user.value?.isVerified) {
    if (import.meta.client) {
      const toast = useToast()
      toast.add({
        title: 'Підтвердіть електронну пошту',
        description: 'Для створення та редагування рецептів необхідно підтвердити пошту.',
        color: 'warning',
        icon: 'i-lucide-mail-warning',
      })
    }

    if (from.name && from.fullPath !== to.fullPath) {
      return abortNavigation()
    }
    return navigateTo('/')
  }
})

