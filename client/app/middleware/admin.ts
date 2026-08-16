export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, isAdmin, initAuth } = useAuth()

  await initAuth()

  if (!isLoggedIn.value) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
  }

  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
