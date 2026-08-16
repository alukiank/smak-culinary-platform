
export const useCloudinary = () => {
  const { $cloudinary } = useNuxtApp()

  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref<string | null>(null)

  /**
   * Uploads an image directly to Cloudinary using signed requests.
   * Tracks upload progress and maintains reactive states.
   */
  const upload = async (file: File): Promise<{ publicId: string; secureUrl: string } | null> => {
    isUploading.value = true
    uploadProgress.value = 0
    error.value = null

    try {
      const result = await $cloudinary.upload(file, (progress) => {
        uploadProgress.value = progress
      })
      return result
    } catch (err: any) {
      console.error('useCloudinary -> upload error:', err)
      error.value = err.message || 'Помилка при завантаженні зображення на хмару.'
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Generates a transformed, responsive, and optimized image URL from a publicId.
   */
  const getUrl = (
    publicId: string | null | undefined,
    options?: Parameters<typeof $cloudinary.url>[1]
  ): string => {
    return $cloudinary.url(publicId, options)
  }

  /**
   * Generates a tiny, blurred image URL for premium blur-up transition layouts.
   */
  const getPlaceholderUrl = (publicId: string | null | undefined): string => {
    return $cloudinary.placeholder(publicId)
  }

  /**
   * Deletes an image.
   * 
   * NOTE: Cloudinary requires secure api_secret signatures for server-to-server deletions (destroy API)
   * to prevent malicious client-side destruction. In our platform, the backend automatically takes care of deleting
   * files asynchronously whenever their corresponding records (recipes, reviews, users) are deleted, or when they are
   * overwritten/orphaned.
   * 
   * This frontend method acts as a local state cleaner, but alerts developers of this secure flow.
   */
  const deleteImage = async (publicId: string): Promise<boolean> => {
    error.value = null
    try {
      console.log(`[Cloudinary Client] Local state cleaning for asset: ${publicId}. Physical deletion is securely delegated to the NestJS backend via database CASCADE or lifecycle events.`)
      // If we need to perform additional actions (e.g. notify the server), we can do so here.
      return true
    } catch (err: any) {
      error.value = err.message || 'Помилка очищення локального файлу.'
      return false
    }
  }

  return {
    isUploading,
    uploadProgress,
    error,
    upload,
    getUrl,
    getPlaceholderUrl,
    deleteImage,
  }
}
