import type { 
  RecipeReviewResponseDto, 
  CreateRecipeReviewDto, 
  UpdateRecipeReviewDto,
  RecipeReviewsPaginatedResponse
} from '~/types/recipe'

export const useRecipeReviews = () => {
  const loading = ref(false)

  /**
   * GET /recipes/{recipeId}/reviews
   * Fetches paginated reviews for a specific recipe.
   */
  const fetchReviews = async (recipeId: string, page = 1, limit = 10): Promise<RecipeReviewsPaginatedResponse | null> => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const response = await $api<RecipeReviewsPaginatedResponse>(`/recipes/${recipeId}/reviews`, {
        query: { page, limit }
      })
      return response
    } catch (err) {
      console.error('Error fetching recipe reviews:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * POST /recipes/{recipeId}/reviews
   * Adds a new review (rating, optional text, optional imageId) to a recipe.
   */
  const createReview = async (recipeId: string, reviewDto: CreateRecipeReviewDto): Promise<{ success: boolean; data?: RecipeReviewResponseDto; error?: string }> => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const data = await $api<RecipeReviewResponseDto>(`/recipes/${recipeId}/reviews`, {
        method: 'POST',
        body: reviewDto
      })
      return { success: true, data }
    } catch (err: any) {
      console.error('Error creating recipe review:', err)
      const errorMsg = err.data?.message || 'Не вдалося додати відгук. Можливо, ви вже залишили відгук на цей рецепт.'
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  /**
   * PATCH /reviews/{id}
   * Updates an existing review written by the current user.
   */
  const updateReview = async (id: string, reviewDto: UpdateRecipeReviewDto): Promise<{ success: boolean; data?: RecipeReviewResponseDto; error?: string }> => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const data = await $api<RecipeReviewResponseDto>(`/reviews/${id}`, {
        method: 'PATCH',
        body: reviewDto
      })
      return { success: true, data }
    } catch (err: any) {
      console.error('Error updating recipe review:', err)
      const errorMsg = err.data?.message || 'Не вдалося оновити відгук.'
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  /**
   * DELETE /reviews/{id}
   * Removes a review along with its comment cascade.
   */
  const deleteReview = async (id: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const success = await $api<boolean>(`/reviews/${id}`, {
        method: 'DELETE'
      })
      return { success }
    } catch (err: any) {
      console.error('Error deleting recipe review:', err)
      const errorMsg = err.data?.message || 'Не вдалося видалити відгук.'
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview
  }
}

