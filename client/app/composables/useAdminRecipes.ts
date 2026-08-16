import type { RecipeAdminResponseDto, RecipeSearchQuery, RecipeAdminSearchResponse, RecipeStatus } from '~/types/recipe'

export const useAdminRecipes = () => {
  const { $api } = useNuxtApp()

  const recipes = useState<RecipeAdminResponseDto[]>('admin-recipes-list', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = useState<{
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  } | null>('admin-recipes-meta', () => null)

  /**
   * Fetch recipes for admin with full details and pagination.
   */
  const fetchRecipes = async (query?: RecipeSearchQuery) => {
    loading.value = true
    error.value = null
    try {
      const cleanParams: Record<string, any> = {}
      if (query) {
        Object.entries(query).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            cleanParams[key] = val
          }
        })
      }

      const response = await $api<RecipeAdminSearchResponse>('/admin/recipes', {
        method: 'GET',
        query: cleanParams,
      })

      recipes.value = response.data || []
      meta.value = response.meta || null
    } catch (err: any) {
      console.error('Error fetching admin recipes:', err)
      error.value = err.data?.message || 'Помилка при завантаженні рецептів.'
      recipes.value = []
      meta.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update recipe status (admin).
   */
  const updateStatus = async (id: string, status: RecipeStatus) => {
    loading.value = true
    error.value = null
    try {
      await $api(`/admin/recipes/${id}/status`, {
        method: 'PATCH',
        body: { status },
      })
      // Update local status
      const recipe = recipes.value.find(r => r.id === id)
      if (recipe) recipe.status = status
      return true
    } catch (err: any) {
      console.error(`Error updating status for recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при зміні статусу.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete recipe (admin).
   */
  const deleteRecipe = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $api(`/admin/recipes/${id}`, {
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
   * Fetch a single recipe by ID with full details (admin).
   */
  const fetchRecipe = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<RecipeAdminResponseDto>(`/admin/recipes/${id}`, {
        method: 'GET',
      })
      return response
    } catch (err: any) {
      console.error(`Error fetching recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при завантаженні рецепту.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update recipe (admin).
   */
  const updateRecipe = async (id: string, data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<RecipeAdminResponseDto>(`/admin/recipes/${id}`, {
        method: 'PUT',
        body: data,
      })
      return response
    } catch (err: any) {
      console.error(`Error updating recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при оновленні рецепту.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    recipes,
    loading,
    error,
    meta,
    fetchRecipes,
    updateStatus,
    deleteRecipe,
    fetchRecipe,
    updateRecipe,
  }
}
