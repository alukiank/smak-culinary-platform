import { appendHeader } from 'h3'
import type { FetchRequest, FetchOptions } from 'ofetch'

interface CustomFetchOptions extends FetchOptions<any> {
  _retry?: boolean
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  let apiUrl = config.public.apiUrl || 'http://localhost:4000'

  if (import.meta.server) {
    apiUrl = process.env.NUXT_API_URL_INTERNAL || 'http://localhost:4000'
  }

  let isRefreshing = false
  let refreshQueue: Array<{ resolve: (value: any) => void; reject: (reason: any) => void }> = []

  const processQueue = (error: any, success: boolean = false) => {
    refreshQueue.forEach((promise) => {
      if (success) {
        promise.resolve(null)
      } else {
        promise.reject(error)
      }
    })
    refreshQueue = []
  }

  const baseFetch = $fetch.create({
    baseURL: apiUrl,
    retry: 0,
    onRequest({ options }) {
      const headers = (options.headers = options.headers || {}) as any

      if (import.meta.server) {
        nuxtApp.runWithContext(() => {
          const ssrCookies = useState<Record<string, string>>('ssr-cookies', () => ({}))

          if (Object.keys(ssrCookies.value).length === 0) {
            const originalCookieHeader = useRequestHeaders(['cookie']).cookie || ''
            originalCookieHeader.split(';').forEach(c => {
              const [key, ...val] = c.trim().split('=')
              if (key) ssrCookies.value[key.trim()] = val.join('=').trim()
            })
          }

          const cookieHeader = Object.entries(ssrCookies.value)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ')

          if (cookieHeader) {
            if (Array.isArray(headers)) {
              headers.push(['cookie', cookieHeader])
            } else if (headers instanceof Headers) {
              headers.set('cookie', cookieHeader)
            } else {
              headers['cookie'] = cookieHeader
            }
          }
        })
      }

      options.credentials = 'include'
    }
  })

  const apiFetch = async <T = any>(
    request: FetchRequest,
    options?: CustomFetchOptions
  ): Promise<T> => {
    const opts = options || {}

    try {
      return await baseFetch<T>(request as any, opts as any)
    } catch (error: any) {
      const requestUrl = request.toString()

      if (
        error.response?.status === 401 &&
        !opts._retry &&
        !requestUrl.includes('/auth/refresh') &&
        !requestUrl.includes('/auth/login') &&
        !requestUrl.includes('/auth/signup') &&
        !requestUrl.includes('/auth/forgot-password') &&
        !requestUrl.includes('/auth/reset-password') &&
        !requestUrl.includes('/auth/verify-email') &&
        !requestUrl.includes('/auth/resend-email-verification') &&
        !requestUrl.includes('/auth/logout')
      ) {

        if (isRefreshing) {
          await new Promise<any>((resolve, reject) => {
            refreshQueue.push({ resolve, reject })
          })
          opts._retry = true
          return await baseFetch<T>(request as any, opts as any)
        }

        isRefreshing = true

        try {
          const refreshHeaders: HeadersInit = {}

          if (import.meta.server) {
            nuxtApp.runWithContext(() => {
              const ssrCookies = useState<string | null>('ssr-cookies')
              const cookieHeader = ssrCookies.value || useRequestHeaders(['cookie']).cookie
              if (cookieHeader) refreshHeaders['cookie'] = cookieHeader
            })
          }

          const refreshResponse = await baseFetch.raw(`/auth/refresh`, {
            method: 'POST',
            headers: refreshHeaders,
          })

          if (import.meta.server) {
            const setCookies = refreshResponse.headers.getSetCookie()
            if (setCookies && setCookies.length > 0) {
              nuxtApp.runWithContext(() => {
                const event = useRequestEvent()
                const ssrCookies = useState<Record<string, string>>('ssr-cookies', () => ({}))

                if (Object.keys(ssrCookies.value).length === 0) {
                  const originalCookieHeader = useRequestHeaders(['cookie']).cookie || ''
                  originalCookieHeader.split(';').forEach(c => {
                    const [key, ...val] = c.trim().split('=')
                    if (key) ssrCookies.value[key] = val.join('=')
                  })
                }

                setCookies.forEach((cookieStr) => {
                  if (event) appendHeader(event, 'set-cookie', cookieStr)

                  const [fullPair] = cookieStr.split(';')
                  if (fullPair) {
                    const [key, ...val] = fullPair.trim().split('=')
                    if (key) ssrCookies.value[key] = val.join('=')
                  }
                })
              })
            }
          }

          isRefreshing = false
          processQueue(null, true)

          opts._retry = true
          return await baseFetch<T>(request as any, opts as any)

        } catch (refreshError: any) {
          isRefreshing = false
          processQueue(refreshError, false)

          nuxtApp.runWithContext(() => {
            const { user } = useAuth()
            user.value = null
          })

          throw refreshError
        }
      }

      throw error
    }
  }

  return {
    provide: {
      api: apiFetch
    }
  }
})
