import type { ModerationLog, ModerationDecision } from '~/types/moderation'
import type { RecipeReviewResponseDto } from '~/types/recipe'

export const useAdminModeration = () => {
  const { $api } = useNuxtApp()

  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Local list of admin reviews
  const reviews = useState<RecipeReviewResponseDto[]>('admin-reviews-list', () => [])
  const reviewsMeta = useState<{
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  } | null>('admin-reviews-meta', () => null)

  /**
   * POST /admin/moderation/recipe/{id}
   * Submit a moderation decision for a recipe.
   */
  const moderateRecipe = async (id: string, decision: ModerationDecision, reason?: string): Promise<ModerationLog> => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<ModerationLog>(`/admin/moderation/recipe/${id}`, {
        method: 'POST',
        body: { decision, reason },
      })
      return response
    } catch (err: any) {
      console.error(`Error moderating recipe ${id}:`, err)
      error.value = err.data?.message || 'Помилка при модерації рецепту.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * GET /admin/moderation/recipe/{id}/logs
   * Fetch full moderation history for a recipe.
   */
  const fetchRecipeLogs = async (id: string): Promise<ModerationLog[]> => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<ModerationLog[]>(`/admin/moderation/recipe/${id}/logs`, {
        method: 'GET',
      })
      return response || []
    } catch (err: any) {
      console.error(`Error fetching recipe logs ${id}:`, err)
      error.value = err.data?.message || 'Помилка при завантаженні історії модерації рецепту.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * POST /admin/moderation/recipe/review/{id}
   * Submit a moderation decision for a recipe review.
   */
  const moderateReview = async (id: string, decision: ModerationDecision, reason?: string): Promise<ModerationLog> => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<ModerationLog>(`/admin/moderation/recipe/review/${id}`, {
        method: 'POST',
        body: { decision, reason },
      })
      return response
    } catch (err: any) {
      console.error(`Error moderating review ${id}:`, err)
      error.value = err.data?.message || 'Помилка при модерації відгуку.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * GET /admin/moderation/recipe/review/{id}/logs
   * Fetch full moderation history for a review.
   */
  const fetchReviewLogs = async (id: string): Promise<ModerationLog[]> => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<ModerationLog[]>(`/admin/moderation/recipe/review/${id}/logs`, {
        method: 'GET',
      })
      return response || []
    } catch (err: any) {
      console.error(`Error fetching review logs ${id}:`, err)
      error.value = err.data?.message || 'Помилка при завантаженні історії модерації відгуку.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * GET /admin/reviews
   * Fetch all reviews (for moderation / listing).
   * Since this GET request technically specifies a request body, we will pass parameters in both query and body
   * to ensure compatibility with different server configurations.
   */
  const fetchReviews = async (query?: { page?: number; limit?: number; isPublished?: boolean }) => {
    loading.value = true
    error.value = null
    try {
      const cleanParams: Record<string, any> = {}
      if (query) {
        Object.entries(query).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            cleanParams[key] = val
          }
        })
      }

      // To handle GET, we send cleanParams as query params
      const response = await $api<{
        data: RecipeReviewResponseDto[]
        meta: typeof reviewsMeta.value
      }>('/admin/reviews', {
        method: 'GET',
        query: cleanParams,
      })

      reviews.value = response.data || []
      reviewsMeta.value = response.meta || null
    } catch (err: any) {
      console.error('Error fetching admin reviews:', err)
      error.value = err.data?.message || 'Помилка при завантаженні відгуків.'
      reviews.value = []
      reviewsMeta.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * DELETE /admin/reviews/{id}
   * Force delete a review.
   */
  const deleteReview = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      await $api(`/admin/reviews/${id}`, {
        method: 'DELETE',
      })
      reviews.value = reviews.value.filter(r => r.id !== id)
      return true
    } catch (err: any) {
      console.error(`Error deleting review ${id}:`, err)
      error.value = err.data?.message || 'Помилка при видаленні відгуку.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    reviews,
    reviewsMeta,
    moderateRecipe,
    fetchRecipeLogs,
    moderateReview,
    fetchReviewLogs,
    fetchReviews,
    deleteReview,
  }
}
