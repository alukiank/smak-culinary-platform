<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUser } from '~/composables/useUser'
import { useRecipeReviews } from '~/composables/useRecipeReviews'
import { useRecipeComments } from '~/composables/useRecipeComments'
import type { RecipeReviewResponseDto, RecipeReviewCommentDto } from '~/types/recipe'
import RecipeReviewsSkeleton from './RecipeReviewsSkeleton.vue'

const props = withDefaults(
  defineProps<{
    recipeId: string
    recipeRating?: number
    recipeNumRatings?: number
  }>(),
  {
    recipeRating: 0,
    recipeNumRatings: 0
  }
)

const emit = defineEmits<{
  (e: 'review-added'): void
}>()

const { user } = useUser()
const toast = useToast()
const {
  loading: reviewsLoading,
  fetchReviews,
  createReview,
  updateReview,
  deleteReview
} = useRecipeReviews()

const {
  fetchComments,
  createComment,
  deleteComment
} = useRecipeComments()

// Reviews list & Pagination state
const reviews = ref<RecipeReviewResponseDto[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const totalReviewsCount = ref(props.recipeNumRatings)
const avgRating = ref(props.recipeRating)

// Form states
const isFormExpanded = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const editingReviewId = ref<string | null>(null)
const imageUploadRef = ref<any>(null)

const form = ref({
  rating: 5,
  text: '',
  imageId: null as string | null
})

// Star rating interactive state
const hoverRating = ref<number | null>(null)

// Computed property to identify if current user already reviewed
const currentUserReview = computed(() => {
  if (!user.value) return null
  return reviews.value.find(r => r.user.id === user.value?.id) || null
})

// Comments reactive state
const activeCommentsReviewId = ref<string | null>(null)
const comments = ref<Record<string, RecipeReviewCommentDto[]>>({})
const commentsLoading = ref<Record<string, boolean>>({})
const commentSubmittingReviewId = ref<string | null>(null)
const newCommentText = ref<Record<string, string>>({})
const commentsPage = ref<Record<string, number>>({})
const commentsTotalPages = ref<Record<string, number>>({})

const isInitialLoad = ref(true)

// Load initial reviews
const loadReviews = async () => {
  const result = await fetchReviews(props.recipeId, currentPage.value, 5)
  if (result) {
    reviews.value = result.data
    totalPages.value = result.meta.totalPages
    totalReviewsCount.value = result.meta.totalItems
  }
  isInitialLoad.value = false
}

onMounted(() => {
  loadReviews()
})

const changePage = async (page: number) => {
  currentPage.value = page
  await loadReviews()
}

// Interactive Star helper
const setRating = (r: number) => {
  form.value.rating = r
}

// Format localized date helper
const formatDate = (isoString: string): string => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getRatingLabel = (r: number) => {
  switch (r) {
    case 1: return 'Жахливо'
    case 2: return 'Не сподобалося'
    case 3: return 'Нормально'
    case 4: return 'Дуже смачно'
    case 5: return 'Шедевр!'
    default: return ''
  }
}

const getRatingColorClass = (r: number) => {
  switch (r) {
    case 1: return 'bg-white dark:bg-smak-neutral-900 text-red-600 dark:text-red-400 border-red-500/20'
    case 2: return 'bg-white dark:bg-smak-neutral-900 text-orange-600 dark:text-orange-400 border-orange-500/20'
    case 3: return 'bg-white dark:bg-smak-neutral-900 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 4: return 'bg-white dark:bg-smak-neutral-900 text-green-600 dark:text-green-400 border-green-500/20'
    case 5: return 'bg-white dark:bg-smak-neutral-900 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    default: return 'bg-white dark:bg-smak-neutral-900 text-smak-neutral-600 dark:text-smak-neutral-400 border-smak-neutral-200'
  }
}

const getRatingArrowClass = (r: number) => {
  switch (r) {
    case 1: return 'bg-white dark:bg-smak-neutral-900 border-r-red-500/20 border-b-red-500/20'
    case 2: return 'bg-white dark:bg-smak-neutral-900 border-r-orange-500/20 border-b-orange-500/20'
    case 3: return 'bg-white dark:bg-smak-neutral-900 border-r-amber-500/20 border-b-amber-500/20'
    case 4: return 'bg-white dark:bg-smak-neutral-900 border-r-green-500/20 border-b-green-500/20'
    case 5: return 'bg-white dark:bg-smak-neutral-900 border-r-emerald-500/20 border-b-emerald-500/20'
    default: return 'bg-white dark:bg-smak-neutral-900 border-r-smak-neutral-200 border-b-smak-neutral-200'
  }
}

const getRatingBadgeClass = (r: number) => {
  switch (r) {
    case 1: return 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20'
    case 2: return 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/20'
    case 3: return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 4: return 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/20'
    case 5: return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    default: return 'bg-smak-neutral-50 dark:bg-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-400 border-smak-neutral-200'
  }
}

const openReviewModal = () => {
  errorMessage.value = null
  editingReviewId.value = null
  form.value = { rating: 5, text: '', imageId: null }
  isFormExpanded.value = true
}

const openEditReviewModal = (existingReview: RecipeReviewResponseDto) => {
  errorMessage.value = null
  editingReviewId.value = existingReview.id
  form.value = {
    rating: existingReview.rating,
    text: existingReview.text || '',
    imageId: existingReview.imageId || null
  }
  isFormExpanded.value = true
}

// Submit a review (Create or Update)
const handleSubmitReview = async () => {
  errorMessage.value = null
  
  if (form.value.rating < 1 || form.value.rating > 5) {
    errorMessage.value = 'Будь ласка, оберіть оцінку від 1 до 5 зірок.'
    return
  }

  submitting.value = true

  // 1. Trigger actual upload if there's a staged file
  if (imageUploadRef.value) {
    console.log('[RecipeReviews] Triggering image upload...')
    try {
      const finalImageId = await imageUploadRef.value.uploadAndGetId()
      console.log('[RecipeReviews] Upload result:', finalImageId)
      form.value.imageId = finalImageId
    } catch (err) {
      console.error('[RecipeReviews] Review image upload failed:', err)
      errorMessage.value = 'Помилка при завантаженні зображення. Спробуйте ще раз.'
      submitting.value = false
      return
    }
  } else {
    console.warn('[RecipeReviews] imageUploadRef is null. Proceeding with current form.imageId:', form.value.imageId)
  }

  if (editingReviewId.value) {
    // UPDATE EXISTING REVIEW
    const result = await updateReview(editingReviewId.value, {
      rating: form.value.rating,
      text: form.value.text || undefined,
      imageId: form.value.imageId || undefined
    })

    submitting.value = false

    if (result.success && result.data) {
      isFormExpanded.value = false
      toast.add({
        title: 'Відгук оновлено!',
        description: 'Ваш відгук успішно відредаговано.',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
      emit('review-added')
      await loadReviews()
    } else {
      errorMessage.value = result.error || 'Не вдалося оновити відгук.'
    }
  } else {
    // CREATE NEW REVIEW
    const result = await createReview(props.recipeId, {
      rating: form.value.rating,
      text: form.value.text || undefined,
      imageId: form.value.imageId || undefined
    })

    submitting.value = false

    if (result.success && result.data) {
      form.value = { rating: 5, text: '', imageId: null }
      isFormExpanded.value = false
      if (result.data.isPublished) {
        toast.add({
          title: 'Відгук опубліковано!',
          description: 'Дякуємо! Ваш відгук успішно додано.',
          color: 'success',
          icon: 'i-lucide-check-circle'
        })
        reviews.value.unshift(result.data)
        totalReviewsCount.value += 1
      } else {
        toast.add({
          title: 'На модерації',
          description: 'Дякуємо! Ваш відгук відправлено на модерацію. Він з\'явиться після перевірки.',
          color: 'success',
          icon: 'i-lucide-clock'
        })
      }
      emit('review-added')
      await loadReviews()
    } else {
      errorMessage.value = result.error || 'Не вдалося зберегти відгук. Перевірте поля форми.'
    }
  }
}

// Toggle comments section below a review
const toggleComments = async (reviewId: string) => {
  if (activeCommentsReviewId.value === reviewId) {
    activeCommentsReviewId.value = null
    return
  }

  activeCommentsReviewId.value = reviewId
  newCommentText.value = { ...newCommentText.value, [reviewId]: '' }
  
  // Fetch comments if not loaded yet
  if (!comments.value[reviewId]) {
    commentsLoading.value = { ...commentsLoading.value, [reviewId]: true }
    try {
      const result = await fetchComments(reviewId, 1, 5)
      if (result) {
        comments.value = { ...comments.value, [reviewId]: result.data }
        commentsPage.value = { ...commentsPage.value, [reviewId]: 1 }
        commentsTotalPages.value = { ...commentsTotalPages.value, [reviewId]: result.meta.totalPages }
      } else {
        comments.value = { ...comments.value, [reviewId]: [] }
      }
    } catch (err) {
      console.error('Fetch comments error:', err)
      comments.value = { ...comments.value, [reviewId]: [] }
    } finally {
      commentsLoading.value = { ...commentsLoading.value, [reviewId]: false }
    }
  }
}

const loadMoreComments = async (reviewId: string) => {
  const nextPage = (commentsPage.value[reviewId] || 1) + 1
  commentsLoading.value = { ...commentsLoading.value, [reviewId]: true }
  try {
    const result = await fetchComments(reviewId, nextPage, 5)
    if (result) {
      const existing = comments.value[reviewId] || []
      comments.value = { ...comments.value, [reviewId]: [...existing, ...result.data] }
      commentsPage.value = { ...commentsPage.value, [reviewId]: nextPage }
      commentsTotalPages.value = { ...commentsTotalPages.value, [reviewId]: result.meta.totalPages }
    }
  } catch (err) {
    console.error('Load more comments error:', err)
  } finally {
    commentsLoading.value = { ...commentsLoading.value, [reviewId]: false }
  }
}

// Submit comment to a review
const handleSubmitComment = async (reviewId: string) => {
  const text = newCommentText.value[reviewId]?.trim()
  if (!text || commentSubmittingReviewId.value === reviewId) return

  commentSubmittingReviewId.value = reviewId

  try {
    const result = await createComment(reviewId, { text })

    if (result.success) {
      newCommentText.value = { ...newCommentText.value, [reviewId]: '' }
      
      // Update local review commentsCount
      const review = reviews.value.find(r => r.id === reviewId)
      if (review) {
        review.commentsCount += 1
      }

      // Always refetch comments to ensure the list is 100% synchronized with server
      const freshComments = await fetchComments(reviewId, 1, 5)
      if (freshComments) {
        comments.value = { ...comments.value, [reviewId]: freshComments.data }
        commentsPage.value = { ...commentsPage.value, [reviewId]: 1 }
        commentsTotalPages.value = { ...commentsTotalPages.value, [reviewId]: freshComments.meta.totalPages }
      } else if (result.data) {
        const currentList = comments.value[reviewId] || []
        comments.value = { ...comments.value, [reviewId]: [...currentList, result.data] }
      }
    } else {
      alert(result.error || 'Не вдалося додати коментар.')
    }
  } catch (err) {
    console.error('Submit comment error:', err)
    alert('Сталася помилка при надсиланні коментаря.')
  } finally {
    commentSubmittingReviewId.value = null
  }
}

// Modal state for deleting comment
const isDeleteCommentModalOpen = ref(false)
const commentToDelete = ref<{ reviewId: string; commentId: string } | null>(null)

const openDeleteCommentModal = (reviewId: string, commentId: string) => {
  commentToDelete.value = { reviewId, commentId }
  isDeleteCommentModalOpen.value = true
}

const confirmDeleteComment = async () => {
  if (!commentToDelete.value) return
  const { reviewId, commentId } = commentToDelete.value
  const result = await deleteComment(commentId)
  if (result.success) {
    const review = reviews.value.find(r => r.id === reviewId)
    if (review) {
      review.commentsCount = Math.max(0, review.commentsCount - 1)
    }
    if (comments.value[reviewId]) {
      const filteredList = comments.value[reviewId].filter(c => c.id !== commentId)
      comments.value = { ...comments.value, [reviewId]: filteredList }
    }
  } else {
    alert(result.error || 'Не вдалося видалити коментар.')
  }
}

// Modal state for deleting review
const isDeleteReviewModalOpen = ref(false)
const reviewToDeleteId = ref<string | null>(null)

const openDeleteReviewModal = (reviewId: string) => {
  reviewToDeleteId.value = reviewId
  isDeleteReviewModalOpen.value = true
}

const confirmDeleteReview = async () => {
  if (!reviewToDeleteId.value) return
  const result = await deleteReview(reviewToDeleteId.value)
  if (result.success) {
    reviews.value = reviews.value.filter(r => r.id !== reviewToDeleteId.value)
    totalReviewsCount.value = Math.max(0, totalReviewsCount.value - 1)
    emit('review-added')
    await loadReviews()
  } else {
    alert(result.error || 'Не вдалося видалити відгук.')
  }
}
</script>

<template>
  <div class="border-t border-smak-neutral-100 dark:border-white/5 pt-6 sm:pt-10 space-y-8">
    
    <!-- Header Block with Title -->
    <div class="select-none pb-4 border-b border-smak-neutral-100/30 dark:border-white/5 space-y-4 sm:space-y-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center justify-between gap-4 w-full sm:w-auto">
        <div>
          <h3 class="text-2xl font-black text-smak-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5 font-heading">
            <span>Відгуки та оцінки</span>
            <span class="px-2.5 py-0.5 rounded-full bg-coral-500/10 text-coral-500 dark:text-coral-400 text-xs font-bold">
              {{ totalReviewsCount }}
            </span>
          </h3>
          <p class="text-base sm:text-lg text-smak-neutral-500 dark:text-smak-neutral-400 mt-1 font-medium">
            Реальний кулінарний досвід нашої спільноти
          </p>
        </div>

        <!-- Mobile Big Rating Badge -->
        <div v-if="totalReviewsCount > 0" class="flex sm:hidden items-center justify-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-yellow-600 dark:text-yellow-400 px-4 rounded-2xl font-display font-black text-xl self-stretch my-0.5">
          <UIcon name="i-lucide-star" class="w-5 h-5 fill-current shrink-0" />
          <span>{{ avgRating.toFixed(1) }}</span>
        </div>
      </div>

      <!-- Mobile CTA Button -->
      <div v-if="totalReviewsCount > 0" class="block sm:hidden pt-2">
        <UButton
          v-if="currentUserReview"
          size="md"
          color="neutral"
          variant="outline"
          class="w-full justify-center rounded-xl font-bold py-2.5 flex items-center gap-2 cursor-pointer transition-all duration-300 border border-smak-neutral-200 dark:border-smak-neutral-700"
          @click="openEditReviewModal(currentUserReview)"
        >
          <UIcon name="i-lucide-edit-3" class="w-4.5 h-4.5 text-coral-500" />
          <span>Редагувати мій відгук</span>
        </UButton>
        <UButton
          v-else
          size="md"
          color="primary"
          class="w-full justify-center rounded-xl font-bold bg-coral-500 hover:bg-coral-600 active:scale-97 text-white py-2.5 flex items-center gap-2 cursor-pointer border-0 shadow-md transition-all duration-300"
          @click="openReviewModal"
        >
          <UIcon name="i-lucide-pen-line" class="w-4.5 h-4.5" />
          <span>Залишити відгук</span>
        </UButton>
      </div>
    </div>

    <!-- Overall Average Score Box -->
    <div v-if="totalReviewsCount > 0" class="hidden sm:flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100/50 dark:border-white/5 p-6 rounded-3xl shadow-xs select-none">
      <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div class="shrink-0 text-center sm:text-left">
          <span class="text-3xl sm:text-4xl font-extrabold text-smak-neutral-900 dark:text-white block leading-none font-display">
            {{ avgRating.toFixed(1) }}
          </span>
          <span class="text-xs font-bold text-smak-neutral-400 dark:text-smak-neutral-500 block mt-1.5">
            з 5 зірок
          </span>
        </div>
        <div class="hidden sm:block h-10 w-px bg-smak-neutral-100 dark:bg-white/10"></div>
        <div>
          <div class="flex items-center gap-1 mb-1 justify-center sm:justify-start text-lg select-none font-sans">
            <span 
              v-for="i in 5" 
              :key="i"
              class="transition-colors duration-300"
              :class="[i <= Math.round(avgRating) ? 'text-amber-400' : 'text-smak-neutral-200 dark:text-smak-neutral-800']"
            >
              ★
            </span>
          </div>
          <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 font-medium leading-relaxed">
            Створено на основі {{ totalReviewsCount }} оцінок від спільноти Smak.
          </p>
        </div>
      </div>
      
      <!-- Leave / Edit review button placed on the right side of the average rating card -->
      <div class="flex flex-col items-center sm:items-end gap-2 text-right shrink-0">
        <UButton
          v-if="currentUserReview"
          size="md"
          color="neutral"
          variant="outline"
          class="rounded-xl font-bold px-5 py-2.5 flex items-center gap-2 cursor-pointer transition-all duration-300 border border-smak-neutral-200 dark:border-smak-neutral-700"
          @click="openEditReviewModal(currentUserReview)"
        >
          <UIcon name="i-lucide-edit-3" class="w-4.5 h-4.5 text-coral-500" />
          <span>Редагувати мій відгук</span>
        </UButton>
        <UButton
          v-else
          size="md"
          color="primary"
          class="rounded-xl font-bold bg-coral-500 hover:bg-coral-600 active:scale-97 text-white px-5 py-2.5 flex items-center gap-2 cursor-pointer border-0 shadow-md hover:shadow-lg hover:shadow-coral-500/15 transition-all duration-300"
          @click="openReviewModal"
        >
          <UIcon name="i-lucide-pen-line" class="w-4.5 h-4.5" />
          <span>Залишити відгук</span>
        </UButton>
      </div>
    </div>

    <!-- Main reviews grid/list -->
    <div class="space-y-6">
      
      <!-- Reviews Loading state -->
      <RecipeReviewsSkeleton v-if="reviewsLoading || isInitialLoad" />

      <!-- Empty reviews state with CTA button -->
      <div v-else-if="reviews.length === 0" class="text-center py-16 bg-smak-neutral-50/30 dark:bg-smak-neutral-900/10 rounded-4xl border border-smak-neutral-100/30 dark:border-white/5 border-dashed select-none">
        <UIcon name="i-lucide-utensils-crossed" class="w-12 h-12 text-smak-neutral-300 dark:text-smak-neutral-700 mx-auto mb-4" />
        <h5 class="text-base font-black text-smak-neutral-700 dark:text-smak-neutral-300">
          Тут поки порожньо
        </h5>
        <p class="text-xs sm:text-sm text-smak-neutral-500 dark:text-smak-neutral-400 mt-2 max-w-md mx-auto leading-relaxed font-medium mb-6">
          Ви можете стати першим, хто приготує цю страву та поділиться своєю оцінкою з кулінарами!
        </p>
        <UButton
          size="md"
          color="primary"
          class="rounded-xl font-bold bg-coral-500 hover:bg-coral-600 active:scale-97 text-white px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer border-0 shadow-md hover:shadow-lg hover:shadow-coral-500/15 transition-all duration-300"
          @click="openReviewModal"
        >
          <UIcon name="i-lucide-pen-line" class="w-4.5 h-4.5" />
          <span>Залишити відгук</span>
        </UButton>
      </div>

      <!-- Published Reviews Feed -->
      <div v-else class="space-y-6">
        <div 
          v-for="review in reviews" 
          :key="review.id" 
          class="bg-white dark:bg-smak-neutral-900 border border-smak-neutral-100/50 dark:border-white/5 rounded-3xl p-6 sm:p-7 shadow-xs group animate-fade-in text-left"
        >
          <!-- Author details -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 select-none">
            <div class="flex items-center gap-3">
               <div class="w-9 h-9 rounded-full bg-coral-500/10 text-coral-500 dark:text-coral-400 flex items-center justify-center font-extrabold text-xs shrink-0">
                {{ review.user.displayname.slice(0, 2).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm sm:text-base font-extrabold text-smak-neutral-900 dark:text-white leading-tight">
                  {{ review.user.displayname }}
                </p>
                <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 mt-0.5 font-medium">
                  {{ formatDate(review.createdAt) }}
                </p>
              </div>
            </div>

            <!-- Rating & Action Buttons -->
            <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-smak-neutral-50 dark:border-white/5">
              <div class="flex items-center gap-0.5 text-base select-none font-sans">
                <span 
                  v-for="i in 5" 
                  :key="i"
                  class="transition-colors duration-300"
                  :class="[i <= review.rating ? 'text-amber-400' : 'text-smak-neutral-200 dark:text-smak-neutral-800']"
                >
                  ★
                </span>
              </div>

              <div v-if="user && user.id === review.user.id" class="flex items-center gap-1">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  class="w-8 h-8 rounded-full hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 text-smak-neutral-500 hover:text-coral-500 flex items-center justify-center cursor-pointer transition-colors focus:outline-none p-0"
                  title="Редагувати відгук"
                  @click="openEditReviewModal(review)"
                >
                  <UIcon name="i-lucide-edit" class="w-4 h-4" />
                </UButton>
                <UButton
                  color="error"
                  variant="ghost"
                  size="xs"
                  class="w-8 h-8 rounded-full bg-red-500/5 hover:bg-red-500/15 text-red-500 flex items-center justify-center border border-red-500/10 cursor-pointer transition-colors focus:outline-none p-0"
                  title="Видалити відгук"
                  @click="openDeleteReviewModal(review.id)"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                </UButton>
              </div>
            </div>
          </div>

          <!-- Review Text -->
          <p v-if="review.text" class="text-sm sm:text-base text-smak-neutral-700 dark:text-smak-neutral-200 leading-relaxed font-medium whitespace-pre-line">
            {{ review.text }}
          </p>

          <!-- Attached Photo -->
          <div v-if="review.imageId" class="mt-4">
            <div class="max-w-md w-full rounded-2xl overflow-hidden border border-smak-neutral-100/50 dark:border-white/5 shadow-xs bg-smak-neutral-50 dark:bg-smak-neutral-950">
              <SharedCloudImage 
                :public-id="review.imageId" 
                :alt="'Фото страви від ' + review.user.displayname"
                :width="600"
                aspect="video"
                class="hover:scale-102 transition-transform duration-500 cursor-pointer"
              />
            </div>
          </div>

          <!-- Toggle comments trigger -->
          <div class="mt-5 pt-4 border-t border-smak-neutral-50 dark:border-white/5 flex items-center justify-between">
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              class="rounded-xl font-black bg-smak-neutral-50 dark:bg-smak-neutral-800 text-smak-neutral-600 dark:text-smak-neutral-400 hover:text-coral-500 dark:hover:text-coral-400 hover:bg-coral-50/50 dark:hover:bg-coral-950/20 transition-colors border-0 cursor-pointer"
              @click="toggleComments(review.id)"
            >
              <template #leading>
                <UIcon name="i-lucide-message-square" class="w-3.5 h-3.5" />
              </template>
              <span>
                {{ activeCommentsReviewId === review.id ? 'Приховати коментарі' : 'Коментарі' }}
              </span>
              <span class="px-1.5 py-0.5 rounded bg-smak-neutral-200/60 dark:bg-smak-neutral-800 text-[10px] font-bold">
                {{ review.commentsCount }}
              </span>
            </UButton>
          </div>

          <!-- Comments sub-list -->
          <Transition name="fade-slide">
            <div v-if="activeCommentsReviewId === review.id" class="mt-4 pl-4 sm:pl-6 border-l-2 border-coral-500/10 dark:border-coral-500/5 space-y-4 pt-2 overflow-hidden">
              <div v-if="commentsLoading[review.id] && (!comments[review.id] || comments[review.id]?.length === 0)" class="flex items-center gap-2 text-xs text-smak-neutral-400 py-2">
                <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin" />
                Завантажуємо коментарі...
              </div>

              <template v-else>
                <div v-if="!comments[review.id] || comments[review.id]?.length === 0" class="text-xs text-smak-neutral-400 py-2 select-none">
                  Коментарів поки немає. Почніть розмову першим!
                </div>

                <TransitionGroup 
                  tag="div" 
                  name="list" 
                  class="space-y-4"
                >
                  <div 
                    v-for="comment in (comments[review.id] || [])" 
                    :key="comment.id"
                    class="bg-smak-neutral-50/50 dark:bg-smak-neutral-800/40 border border-smak-neutral-100/20 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2 group/comment text-left transition-all duration-300"
                  >
                    <div class="flex items-center justify-between gap-3 select-none">
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full bg-coral-500/10 text-coral-500 dark:text-coral-400 flex items-center justify-center font-bold text-xs">
                          {{ comment.user.displayname.slice(0, 1).toUpperCase() }}
                        </div>
                        <div>
                          <span class="text-sm sm:text-base font-extrabold text-smak-neutral-900 dark:text-white">{{ comment.user.displayname }}</span>
                          <span class="text-xs font-medium text-smak-neutral-500 dark:text-smak-neutral-400 ml-2">{{ formatDate(comment.createdAt) }}</span>
                        </div>
                      </div>

                      <UButton
                        v-if="user && user.id === comment.user.id"
                        color="error"
                        variant="ghost"
                        size="xs"
                        class="w-8 h-8 rounded-full bg-red-500/5 hover:bg-red-500/15 text-red-500 flex items-center justify-center border border-red-500/10 cursor-pointer opacity-0 group-hover/comment:opacity-100 transition-all focus:outline-none p-0 shrink-0"
                        title="Видалити коментар"
                        @click="openDeleteCommentModal(review.id, comment.id)"
                      >
                        <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                      </UButton>
                    </div>

                    <p class="text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed font-medium pl-1">
                      {{ comment.text }}
                    </p>
                  </div>
                </TransitionGroup>

                <div v-if="(commentsPage[review.id] || 1) < (commentsTotalPages[review.id] || 1)" class="mt-4 flex justify-start sm:pl-1">
                  <button
                    type="button"
                    :disabled="commentsLoading[review.id]"
                    class="inline-flex items-center gap-2 rounded-full bg-smak-neutral-100 hover:bg-smak-neutral-200 dark:bg-smak-neutral-800 dark:hover:bg-smak-neutral-700 text-smak-neutral-800 dark:text-smak-neutral-200 text-xs font-bold px-4 py-2 transition-all cursor-pointer border-0 focus:outline-none disabled:opacity-50 select-none shadow-xs active:scale-97"
                    @click="loadMoreComments(review.id)"
                  >
                    <UIcon v-if="commentsLoading[review.id]" name="i-lucide-loader-2" class="w-4 h-4 animate-spin shrink-0" />
                    <span>Показати більше</span>
                    <UIcon v-if="!commentsLoading[review.id]" name="i-lucide-chevron-down" class="w-4 h-4 shrink-0" />
                  </button>
                </div>

                <!-- Write comment input box -->
                <div v-if="user" class="flex gap-3 mt-4 items-center animate-fade-in text-left">
                  <div class="w-9 h-9 rounded-full bg-coral-500/10 text-coral-500 dark:text-coral-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                    {{ user.displayname.slice(0, 1).toUpperCase() }}
                  </div>
                  <div class="flex-1">
                    <UInput
                      v-model="newCommentText[review.id]"
                      type="text"
                      size="sm"
                      placeholder="Напишіть відповідь..."
                      class="w-full text-xs! sm:text-sm! font-bold!"
                      :ui="{ base: 'rounded-xl pl-4 pr-4 py-2 h-9 bg-smak-neutral-50 dark:bg-smak-neutral-800 focus-visible:ring-coral-400 text-xs! sm:text-sm! font-bold! text-smak-neutral-900 dark:text-white placeholder:text-smak-neutral-400' }"
                      @keyup.enter="handleSubmitComment(review.id)"
                    />
                  </div>
                  <UButton
                    type="button"
                    :loading="commentSubmittingReviewId === review.id"
                    :disabled="!newCommentText[review.id]?.trim()"
                    class="h-9 px-3.5 flex items-center justify-center rounded-xl bg-coral-500 text-white hover:bg-coral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border-0 shrink-0"
                    @click="handleSubmitComment(review.id)"
                  >
                    <UIcon v-if="commentSubmittingReviewId !== review.id" name="i-lucide-send" class="w-4 h-4" />
                  </UButton>
                </div>
                <div v-else class="text-[11px] text-smak-neutral-400 mt-2 select-none">
                  Будь ласка, <NuxtLink to="/auth/login" class="text-coral-500 hover:underline">увійдіть</NuxtLink>, щоб коментувати.
                </div>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-8 flex justify-center">
          <SharedAppPagination
            :page="currentPage"
            :total="totalReviewsCount"
            :items-per-page="5"
            next-text="Більше"
            @update:page="changePage"
          />
        </div>
      </div>
    </div>

    <!-- Nuxt UI Modal Dialog containing the write-review forms and checks -->
    <UModal 
      v-model:open="isFormExpanded" 
      :title="editingReviewId ? 'Редагувати відгук' : 'Залишити відгук'" 
      :ui="{ 
        overlay: 'z-[100]',
        content: 'z-[100] sm:max-w-xl rounded-3xl border border-smak-neutral-200 dark:border-smak-neutral-800 bg-white dark:bg-smak-neutral-900 shadow-2xl overflow-hidden' 
      }"
    >
      <template #content>
        <!-- Outer scrolling container -->
        <div class="max-h-[85vh] overflow-y-auto w-full">
          <!-- Inner container that preserves padding on all sides -->
          <div class="p-5 sm:p-6 space-y-6 text-left">
            
            <!-- Modal Custom Header -->
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg sm:text-xl font-black font-heading text-smak-neutral-900 dark:text-white leading-tight">
                  {{ editingReviewId ? 'Редагування відгуку' : 'Ваші враження' }}
                </h3>
                <p class="text-xs sm:text-sm text-smak-neutral-600 dark:text-smak-neutral-300 mt-1 font-medium leading-relaxed">
                  Поділіться з іншими кулінарами своїм гастрономічним досвідом приготування цієї страви.
                </p>
              </div>
              
              <button
                type="button"
                class="p-1 rounded-full text-smak-neutral-400 hover:text-smak-neutral-700 dark:hover:text-smak-neutral-200 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
                aria-label="Закрити"
                @click="() => { isFormExpanded = false }"
              >
                <UIcon name="i-lucide-x" class="w-4.5 h-4.5" />
              </button>
            </div>

            <!-- Authorization Check Inside Modal -->
            <div v-if="!user" class="text-center py-8 select-none bg-smak-neutral-50/50 dark:bg-smak-neutral-950/20 rounded-2xl p-6">
              <UIcon name="i-lucide-lock" class="w-12 h-12 text-coral-400 dark:text-coral-500/75 mx-auto mb-4" />
              <p class="text-sm font-black text-smak-neutral-800 dark:text-white">Потрібен вхід</p>
              <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 mt-2 leading-relaxed">
                Увійдіть у свій акаунт, щоб залишати оцінки та відгуки на рецепти.
              </p>
              <div class="flex flex-col sm:flex-row gap-3 mt-6">
                <UButton 
                  to="/auth/login" 
                  size="md" 
                  class="rounded-full font-bold text-white bg-coral-500 hover:bg-coral-600 border-0 shadow-md w-full justify-center cursor-pointer px-5 py-2 text-xs sm:text-sm"
                >
                  Увійти
                </UButton>
                <UButton 
                  to="/auth/register" 
                  size="md" 
                  color="neutral" 
                  variant="ghost" 
                  class="rounded-full font-bold bg-smak-neutral-100 dark:bg-smak-neutral-800 text-smak-neutral-700 dark:text-smak-neutral-300 hover:bg-smak-neutral-200 dark:hover:bg-smak-neutral-700 border-0 w-full justify-center cursor-pointer px-5 py-2 text-xs sm:text-sm"
                >
                  Реєстрація
                </UButton>
              </div>
            </div>

            <!-- Verified Check Inside Modal -->
            <div v-else-if="!user.isVerified" class="text-center py-8 select-none bg-amber-50/20 dark:bg-amber-950/5 border border-amber-200/30 dark:border-amber-900/20 rounded-2xl p-6">
              <UIcon name="i-lucide-mail-warning" class="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p class="text-sm font-black text-smak-neutral-800 dark:text-white mb-1">
                Підтвердіть email
              </p>
              <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-md mx-auto">
                Лише верифіковані шефи можуть додавати відгуки. Перейдіть на сторінку налаштувань профілю для активації.
              </p>
            </div>

            <!-- Render Form Inside Modal -->
            <form v-else @submit.prevent="handleSubmitReview" class="space-y-4">
              <!-- Star selection -->
              <UFormField label="Ваша оцінка" size="sm" class="text-xs sm:text-sm font-bold text-smak-neutral-800 dark:text-white">
                <div class="flex items-center gap-1.5 select-none mt-2">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="relative group/star"
                  >
                    <!-- Vibrant Floating CSS Tooltip -->
                    <div 
                      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-0.5 text-[10px] font-black rounded-lg opacity-0 pointer-events-none group-hover/star:opacity-100 transition-all duration-300 shadow-md border text-center whitespace-nowrap z-50 transform translate-y-1 group-hover/star:translate-y-0"
                      :class="getRatingColorClass(i)"
                    >
                      {{ getRatingLabel(i) }}
                      <!-- Arrow -->
                      <div 
                        class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 border-r border-b"
                        :class="getRatingArrowClass(i)"
                      ></div>
                    </div>

                    <!-- Star Button -->
                    <button
                      type="button"
                      @click="setRating(i)"
                      class="w-9 h-9 flex items-center justify-center rounded-xl bg-smak-neutral-50 dark:bg-smak-neutral-950 border border-smak-neutral-100/50 dark:border-white/5 text-xl transition-all duration-300 focus:outline-none cursor-pointer"
                      :class="[
                        form.rating >= i
                          ? 'text-amber-400 fill-amber-400 scale-105 border-amber-300/40 dark:border-amber-800/40 bg-amber-500/5' 
                          : 'text-smak-neutral-200 dark:text-smak-neutral-800 hover:text-amber-400 hover:scale-105'
                      ]"
                    >
                      ★
                    </button>
                  </div>
                </div>
              </UFormField>

              <!-- Review text -->
              <UFormField label="Текст відгуку" size="sm" class="text-xs sm:text-sm font-bold text-smak-neutral-800 dark:text-white">
                <UTextarea
                  v-model="form.text"
                  :rows="3"
                  size="sm"
                  placeholder="Розкажіть, чи легко було готувати страву, чи сподобався смак..."
                  class="w-full mt-1.5 resize-y text-xs! sm:text-sm! font-bold!"
                  :ui="{ base: 'rounded-xl bg-smak-neutral-50 dark:bg-smak-neutral-950 focus-visible:ring-coral-400 text-xs! sm:text-sm! font-bold! p-3 text-smak-neutral-900 dark:text-white placeholder:text-smak-neutral-400' }"
                />
              </UFormField>

              <!-- Image upload component -->
              <UFormField label="Фото вашої страви" size="sm" class="text-xs sm:text-sm font-bold text-smak-neutral-800 dark:text-white">
                <div class="mt-1.5">
                  <SharedImageUpload 
                    ref="imageUploadRef"
                    v-model="form.imageId" 
                    aspect="video"
                  />
                </div>
              </UFormField>

              <!-- Notification Alerts -->
              <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
                {{ errorMessage }}
              </div>

              <!-- Submit Button and Cancel Row -->
              <div class="flex items-center justify-end gap-2.5 pt-2">
                <UButton
                  type="button"
                  label="Скасувати"
                  color="neutral"
                  variant="ghost"
                  class="rounded-full px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer bg-transparent hover:bg-transparent border border-transparent hover:border-smak-neutral-300 dark:hover:border-smak-neutral-700"
                  @click="() => { isFormExpanded = false }"
                />
                <UButton
                  type="submit"
                  :label="editingReviewId ? 'Зберегти зміни' : 'Опублікувати відгук'"
                  :loading="submitting"
                  class="rounded-full px-5 py-2 text-xs sm:text-sm font-bold shadow-md cursor-pointer bg-coral-500 hover:bg-coral-600 active:scale-97 text-white border-0 transition-all duration-300"
                />
              </div>
            </form>

          </div>
        </div>
      </template>
    </UModal>

    <!-- Confirm Modal for Comment Deletion -->
    <SharedConfirmModal
      v-model:open="isDeleteCommentModalOpen"
      title="Видалити коментар?"
      description="Ви дійсно бажаєте видалити цей коментар? Цю дію неможливо буде скасувати."
      confirm-label="Видалити"
      cancel-label="Скасувати"
      confirm-color="error"
      :on-confirm="confirmDeleteComment"
    />

    <!-- Confirm Modal for Review Deletion -->
    <SharedConfirmModal
      v-model:open="isDeleteReviewModalOpen"
      title="Видалити відгук?"
      description="Ви дійсно бажаєте видалити ваш відгук? Цю дію неможливо буде скасувати."
      confirm-label="Видалити"
      cancel-label="Скасувати"
      confirm-color="error"
      :on-confirm="confirmDeleteReview"
    />

  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
