import type { RecipeResponseDto, RecipeSearchQuery, RecipeSearchResponse, CreateRecipeDto } from '~/types/recipe'

export const useRecipes = (key = 'default') => {
  const { $api } = useNuxtApp()

  const recipes = useState<RecipeResponseDto[]>(`recipes-list-${key}`, () => [])
  const similarRecipes = useState<RecipeResponseDto[]>(`recipes-similar-${key}`, () => [])
  const currentRecipe = useState<RecipeResponseDto | null>(`recipes-current-${key}`, () => null)

  const loading = ref(false)
  const similarLoading = ref(true)
  const currentLoading = ref(false)

  const error = ref<string | null>(null)
  const similarError = ref<string | null>(null)
  const currentError = ref<string | null>(null)

  const meta = useState<{
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  } | null>(`recipes-meta-${key}`, () => null)

  /**
   * Fetch and filter public recipes with pagination.
   * If query is specified, results are sorted semantically by pgvector.
   */
  const fetchRecipes = async (query?: RecipeSearchQuery) => {
    loading.value = true
    error.value = null
    try {
      // Build search params, removing undefined keys
      const cleanParams: Record<string, any> = {}
      if (query) {
        Object.entries(query).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            cleanParams[key] = val
          }
        })
      }

      const response = await $api<RecipeSearchResponse>('/recipes', {
        method: 'GET',
        query: cleanParams,
      })

      recipes.value = response.data || []
      meta.value = response.meta || null
    } catch (err: any) {
      console.error('Error fetching recipes:', err)
      error.value = err.data?.message || 'Помилка при завантаженні рецептів. Спробуйте пізніше.'
      recipes.value = []
      meta.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single recipe by its UUID.
   */
  const fetchRecipeById = async (id: string) => {
    currentLoading.value = true
    currentError.value = null
    try {
      const response = await $api<RecipeResponseDto>(`/recipes/${id}`, {
        method: 'GET',
      })
      currentRecipe.value = response
      return response
    } catch (err: any) {
      console.error(`Error fetching recipe ${id}:`, err)
      currentError.value = err.data?.message || 'Рецепт не знайдено або доступ заборонено.'
      currentRecipe.value = null
      throw err
    } finally {
      currentLoading.value = false
    }
  }

  /**
   * Fetch up to 5 semantically similar recipes based on cosine distance.
   */
  const fetchSimilarRecipes = async (recipeId: string, limit?: number) => {
    similarLoading.value = true
    similarError.value = null
    try {
      const response = await $api<RecipeResponseDto[]>('/recipes/similar', {
        method: 'GET',
        query: { id: recipeId, limit: limit || 6 },
      })
      similarRecipes.value = response || []
      return response
    } catch (err: any) {
      console.error(`Error fetching similar recipes for ${recipeId}:`, err)
      similarError.value = err.data?.message || 'Помилка завантаження схожих рецептів.'
      similarRecipes.value = []
    } finally {
      similarLoading.value = false
    }
  }

  /**
   * Create a new recipe.
   */
  const createRecipe = async (payload: CreateRecipeDto) => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<RecipeResponseDto>('/recipes', {
        method: 'POST',
        body: payload,
      })
      return response
    } catch (err: any) {
      console.error('Error creating recipe:', err)
      error.value = err.data?.message || 'Помилка при створенні рецепту. Перевірте правильність заповнення полів.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing recipe.
   */
  const updateRecipe = async (id: string, payload: CreateRecipeDto) => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<RecipeResponseDto>(`/recipes/${id}`, {
        method: 'PUT',
        body: payload,
      })
      return response
    } catch (err: any) {
      console.error(`Error updating recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при оновленні рецепту. Перевірте правильність заповнення полів.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a recipe.
   */
  const deleteRecipe = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $api(`/recipes/${id}`, {
        method: 'DELETE',
      })
      // Remove from local list
      recipes.value = recipes.value.filter(r => r.id !== id)
      return true
    } catch (err: any) {
      console.error(`Error deleting recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при видаленні рецепту.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Move recipe to draft.
   */
  const draftRecipe = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $api(`/recipes/${id}/draft`, {
        method: 'PATCH',
      })
      // Update local status
      const recipe = recipes.value.find(r => r.id === id)
      if (recipe) recipe.status = 'draft'
      if (currentRecipe.value?.id === id) currentRecipe.value.status = 'draft'
      return true
    } catch (err: any) {
      console.error(`Error drafting recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при переведенні у чернетку.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Archive a recipe.
   */
  const archiveRecipe = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $api(`/recipes/${id}/archive`, {
        method: 'PATCH',
      })
      // Update local status
      const recipe = recipes.value.find(r => r.id === id)
      if (recipe) recipe.status = 'archived'
      if (currentRecipe.value?.id === id) currentRecipe.value.status = 'archived'
      return true
    } catch (err: any) {
      console.error(`Error archiving recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при архівуванні рецепту.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Unarchive a recipe (move back to draft).
   */
  const unarchiveRecipe = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $api(`/recipes/${id}/unarchive`, {
        method: 'PATCH',
      })
      // Update local status
      const recipe = recipes.value.find(r => r.id === id)
      if (recipe) recipe.status = 'draft'
      if (currentRecipe.value?.id === id) currentRecipe.value.status = 'draft'
      return true
    } catch (err: any) {
      console.error(`Error unarchiving recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при розархівуванні рецепту.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Publish a recipe (move from draft to premoderation).
   */
  const publishRecipe = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $api(`/recipes/${id}/publish`, {
        method: 'PATCH',
      })
      // Update local status
      const recipe = recipes.value.find(r => r.id === id)
      if (recipe) recipe.status = 'premoderation'
      if (currentRecipe.value?.id === id) currentRecipe.value.status = 'premoderation'
      return true
    } catch (err: any) {
      console.error(`Error publishing recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при публікації рецепту.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    recipes,
    similarRecipes,
    currentRecipe,
    loading,
    similarLoading,
    currentLoading,
    error,
    similarError,
    currentError,
    meta,
    fetchRecipes,
    fetchRecipeById,
    fetchSimilarRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    publishRecipe,
    draftRecipe,
    archiveRecipe,
    unarchiveRecipe,
  }
}
