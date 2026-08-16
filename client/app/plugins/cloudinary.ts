export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const cloudName = config.public.cloudinaryCloudName || 'demo'

  /**
   * Generates an optimized Cloudinary transformation URL.
   * Fully responsive, supports auto-format, auto-quality, and custom transformations.
   */
  const getUrl = (
    publicId: string | null | undefined,
    options: {
      width?: number
      height?: number
      crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'pad' | 'crop'
      gravity?: 'face' | 'center' | 'north' | 'south' | 'east' | 'west'
      quality?: string | number
      format?: string
      blur?: number
      radius?: number | 'max'
    } = {}
  ): string => {
    if (!publicId) return ''
    
    // If it's already an absolute URL (e.g. Unsplash fallback or external photo), return as is
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
      return publicId
    }

    const params: string[] = ['f_auto', 'q_auto']

    if (options.width) params.push(`w_${options.width}`)
    if (options.height) params.push(`h_${options.height}`)
    if (options.crop) params.push(`c_${options.crop}`)
    if (options.gravity) params.push(`g_${options.gravity}`)
    if (options.quality) params.push(`q_${options.quality}`)
    if (options.format) params.push(`f_${options.format}`)
    if (options.blur) params.push(`e_blur:${options.blur}`)
    if (options.radius) params.push(`r_${options.radius}`)

    const transformations = params.join(',')
    
    // Auto-prepend recipes/ folder if it is a pure ID without a folder structure
    let finalPublicId = publicId
    if (!finalPublicId.includes('/')) {
      finalPublicId = `recipes/${finalPublicId}`
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${finalPublicId}`
  }

  /**
   * Generates a Low-Quality Image Placeholder (LQIP) for modern blur-up loading effects.
   */
  const getPlaceholderUrl = (publicId: string | null | undefined): string => {
    return getUrl(publicId, { width: 50, blur: 1000 })
  }

  /**
   * Securely uploads a file to Cloudinary directly from the client.
   * Obtains a secure short-lived signature from the NestJS backend and performs progress tracking.
   */
  const uploadImage = async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ publicId: string; secureUrl: string }> => {
    if (!import.meta.client) {
      throw new Error('Завантаження зображень підтримується лише на клієнтській стороні.')
    }

    try {
      const { $api } = useNuxtApp()

      // 1. Obtain temporary signature and upload params from backend
      const sigData = await $api<{
        signature: string
        timestamp: number
        folder: string
        publicId: string
        apiKey: string
        cloudName: string
      }>('/cloudinary/signature')

      // 2. Prepare FormData for Cloudinary Upload API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sigData.apiKey)
      formData.append('timestamp', sigData.timestamp.toString())
      formData.append('signature', sigData.signature)
      formData.append('folder', sigData.folder)
      formData.append('public_id', sigData.publicId)

      // 3. Upload directly using XMLHttpRequest to get accurate progress updates
      const result = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`)

        if (onProgress && xhr.upload) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100)
              onProgress(percentage)
            }
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText)
              resolve(res)
            } catch (err) {
              reject(new Error('Не вдалося розпарсити відповідь від Cloudinary.'))
            }
          } else {
            reject(new Error(`Завантаження не вдалося. Код помилки: ${xhr.status} ${xhr.statusText}`))
          }
        }

        xhr.onerror = () => {
          reject(new Error('Мережева помилка при спробі завантаження зображення.'))
        }

        xhr.send(formData)
      })

      if (onProgress) onProgress(100)

      // Only send the pure public ID to the DB (strip out folder prefix, e.g. 'recipes/')
      const cleanId = result.public_id.includes('/') ? result.public_id.split('/').pop()! : result.public_id

      return {
        publicId: cleanId,
        secureUrl: result.secure_url,
      }
    } catch (err: any) {
      console.error('Помилка завантаження зображення:', err)
      const errorMessage = err.data?.message || err.message || 'Сталася помилка при збереженні зображення.'
      throw new Error(errorMessage)
    }
  }

  return {
    provide: {
      cloudinary: {
        url: getUrl,
        placeholder: getPlaceholderUrl,
        upload: uploadImage,
      },
    },
  }
})
