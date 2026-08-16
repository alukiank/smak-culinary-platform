export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, initAuth } = useAuth()

  await initAuth()

  if (!isLoggedIn.value) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
  }
})
