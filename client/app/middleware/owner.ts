export default defineNuxtRouteMiddleware(async (to) => {
  const { user, initAuth, isLoggedIn } = useAuth()
  const { fetchRecipeById } = useRecipes()

  await initAuth()

  if (!isLoggedIn.value) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
  }

  const recipeId = to.params.id as string
  if (!recipeId) return navigateTo('/recipes')

  try {
    const recipe = await fetchRecipeById(recipeId)
    if (!recipe) {
      return navigateTo('/recipes')
    }

    const isOwner = user.value?.id === recipe.user.id || user.value?.role === 'admin'

    if (!isOwner) {
      return navigateTo(`/recipes/${recipeId}`)
    }
  } catch (err) {
    console.error('Owner middleware error:', err)
    return navigateTo('/recipes')
  }
})
