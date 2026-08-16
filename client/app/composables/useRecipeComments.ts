import type {
  RecipeReviewCommentDto,
  CreateRecipeReviewCommentDto,
  RecipeCommentsPaginatedResponse
} from '~/types/recipe'

export const useRecipeComments = () => {
  const loading = ref(false)
  const { $api } = useNuxtApp()

  /**
   * GET /reviews/{reviewId}/comments
   * Fetches paginated comments for a specific review.
   */
  const fetchComments = async (reviewId: string, page = 1, limit = 10): Promise<RecipeCommentsPaginatedResponse | null> => {
    loading.value = true
    try {
      const response = await $api<RecipeCommentsPaginatedResponse>(`/reviews/${reviewId}/comments`, {
        query: { page, limit }
      })
      return response
    } catch (err) {
      console.error('Error fetching comments:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * POST /reviews/{reviewId}/comments
   * Adds a new comment to a review.
   */
  const createComment = async (reviewId: string, commentDto: CreateRecipeReviewCommentDto): Promise<{ success: boolean; data?: RecipeReviewCommentDto; error?: string }> => {
    loading.value = true
    try {
      const data = await $api<RecipeReviewCommentDto>(`/reviews/${reviewId}/comments`, {
        method: 'POST',
        body: commentDto
      })
      return { success: true, data }
    } catch (err: any) {
      console.error('Error creating comment:', err)
      const errorMsg = err.data?.message || 'Не вдалося додати коментар.'
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  /**
   * DELETE /comments/{id}
   * Deletes a review comment by ID.
   */
  const deleteComment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    loading.value = true
    try {
      const success = await $api<boolean>(`/comments/${id}`, {
        method: 'DELETE'
      })
      return { success }
    } catch (err: any) {
      console.error('Error deleting comment:', err)
      const errorMsg = err.data?.message || 'Не вдалося видалити коментар.'
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    fetchComments,
    createComment,
    deleteComment
  }
}
