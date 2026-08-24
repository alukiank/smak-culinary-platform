import { computed } from 'vue'
import type { UserPrivateDto } from '~/types/user'
import { formatApiError } from '~/utils/error-handler'

// Client-side only promise cache to prevent concurrent race conditions
let clientFetchPromise: Promise<void> | null = null

// Singleton init promise — ensures auth is initialized exactly once per page load
let initPromise: Promise<void> | null = null

export const useAuth = () => {
  const user = useState<UserPrivateDto | null>('auth-user', () => null)
  // true once the initial fetchUser has settled (success or failure)
  const authReady = useState<boolean>('auth-ready', () => false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Pre-resolve Nuxt app context and composable states/methods synchronously at setup time
  const { $api } = useNuxtApp()
  const { fetchSubscription, clearSubscription } = useBilling()
  const { clearCollections } = useCollections()
  const { clearChatState } = useChat()

  /**
   * Fetches the current user profile from GET /auth/me
   */
  const fetchUser = async () => {
    if (user.value) return

    if (import.meta.client) {
      if (clientFetchPromise) return clientFetchPromise

      clientFetchPromise = (async () => {
        try {
          const data = await $api<UserPrivateDto>('/auth/me')
          user.value = data
          try {
            await fetchSubscription()
          } catch (subErr) {
            console.error('Error fetching subscription in fetchUser client:', subErr)
          }
        } catch (err: any) {
          console.error('Error fetching user profile on client:', err?.message || err)
          user.value = null
        } finally {
          authReady.value = true
          clientFetchPromise = null
        }
      })()

      return clientFetchPromise
    }

    try {
      const data = await $api<UserPrivateDto>('/auth/me')
      user.value = data
      try {
        await fetchSubscription()
      } catch (subErr) {
        console.error('Error fetching subscription in fetchUser server:', subErr)
      }
    } catch (err: any) {
      console.error('Error fetching user profile on server:', err?.message || err)
      user.value = null
    } finally {
      authReady.value = true
    }
  }

  /**
   * Initializes auth state exactly once per page load.
   * Returns a singleton promise so multiple callers (middleware, app.vue)
   * all wait for the same request rather than firing duplicates.
   */
  const initAuth = (): Promise<void> => {
    if (import.meta.server) {
      return fetchUser()
    }

    if (!initPromise) {
      initPromise = fetchUser()
    }
    return initPromise
  }

  /**
   * Authenticate user with Email & Password
   */
  const login = async (email: string, password: string) => {
    try {
      await $api('/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      await fetchUser()
      try {
        await fetchSubscription()
      } catch (subErr) {
        console.error('Error fetching subscription inside login:', subErr)
      }

      return { success: true }
    } catch (err: any) {
      console.error('Login error:', err?.message || err)
      const message = formatApiError(err, 'Невірний email або пароль')
      return { success: false, error: message }
    }
  }

  /**
   * Sign up a new user account
   */
  const register = async (username: string, displayname: string, email: string, password: string) => {
    try {
      await $api('/auth/signup', {
        method: 'POST',
        body: { username, displayname, email, password }
      })

      await fetchUser()
      try {
        await fetchSubscription()
      } catch (subErr) {
        console.error('Error fetching subscription inside register:', subErr)
      }

      return { success: true }
    } catch (err: any) {
      console.error('Registration error:', err?.message || err)
      const message = formatApiError(err, 'Помилка реєстрації. Перевірте правильність введених даних')
      return { success: false, error: message }
    }
  }

  /**
   * Log out of the system
   */
  const logout = async () => {
    try {
      await $api('/auth/logout', { method: 'POST' })
    } catch (err: any) {
      console.error('Logout request error:', err?.message || err)
    } finally {
      user.value = null
      authReady.value = false
      initPromise = null
      clientFetchPromise = null

      // Clear cached subscription/limits and session state on logout
      try {
        clearSubscription()
      } catch (err) {
        console.error('Error clearing subscription on logout:', err)
      }

      try {
        clearCollections()
      } catch (err) {
        console.error('Error clearing collections on logout:', err)
      }

      try {
        clearChatState()
      } catch (err) {
        console.error('Error clearing chats on logout:', err)
      }

      if (import.meta.client) {
        await navigateTo('/')
      }
    }
  }

  /**
   * Request password reset link (Forgot Password)
   */
  const forgotPassword = async (email: string) => {
    try {
      await $api('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      })
      return { success: true }
    } catch (err: any) {
      console.error('Forgot password error:', err?.message || err)
      const message = formatApiError(err, 'Користувача з таким email не знайдено')
      return { success: false, error: message }
    }
  }

  /**
   * Set new password based on email reset token
   */
  const resetPassword = async (resetToken: string, passwordParam: string) => {
    try {
      await $api('/auth/reset-password', {
        method: 'POST',
        body: { token: resetToken, password: passwordParam }
      })
      return { success: true }
    } catch (err: any) {
      console.error('Reset password error:', err?.message || err)
      const message = formatApiError(err, 'Токен недійсний або прострочений')
      return { success: false, error: message }
    }
  }

  /**
   * Verify email address using hex token
   */
  const verifyEmail = async (verificationToken: string) => {
    try {
      await $api('/auth/verify-email', {
        method: 'POST',
        query: { token: verificationToken }
      })

      if (isLoggedIn.value) {
        await fetchUser()
      }
      return { success: true }
    } catch (err: any) {
      console.error('Verify email error:', err?.message || err)
      const message = formatApiError(err, 'Некоректний або прострочений токен підтвердження')
      return { success: false, error: message }
    }
  }

  /**
   * Resend email verification letter
   */
  const resendVerificationEmail = async () => {
    try {
      await $api('/auth/resend-email-verification', { method: 'POST' })
      return { success: true }
    } catch (err: any) {
      console.error('Resend verification error:', err?.message || err)
      const message = formatApiError(err, 'Не вдалося надіслати лист. Спробуйте пізніше.')
      return { success: false, error: message }
    }
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    authReady,
    login,
    register,
    logout,
    fetchUser,
    initAuth,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail
  }
}
