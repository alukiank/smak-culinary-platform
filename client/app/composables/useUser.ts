import type { UserPrivateDto, UserPublicDto, UserRestrictionsDto, UpdateUserDto, UpdatePasswordDto } from '~/types/user'

export const useUser = () => {
  const user = useState<UserPrivateDto | null>('auth-user', () => null)
  const loading = ref(false)

  /**
   * GET /users/me
   * Fetches the profile of the current authenticated user and stores it in the state.
   */
  const fetchProfile = async (): Promise<UserPrivateDto | null> => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const data = await $api<UserPrivateDto>('/users/me')
      // Preserve existing restrictions from user.value so they aren't lost
      user.value = {
        ...user.value,
        ...data,
        allergies: data.allergies !== undefined ? data.allergies : user.value?.allergies,
        dietary: data.dietary !== undefined ? data.dietary : user.value?.dietary
      }
      return user.value
    } catch (err: any) {
      console.error('Error fetching user profile:', err?.message || err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * PUT /users/me
   * Partially updates the current user's profile and synchronizes the state.
   */
  const updateProfile = async (updateDto: UpdateUserDto) => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const data = await $api<UserPrivateDto>('/users/me', {
        method: 'PUT',
        body: updateDto
      })
      // Sync and merge the updated profile and restrictions in the global state
      user.value = {
        ...user.value,
        ...data,
        allergies: updateDto.allergies !== undefined 
          ? updateDto.allergies 
          : (data.allergies !== undefined ? data.allergies : user.value?.allergies),
        dietary: updateDto.dietary !== undefined 
          ? updateDto.dietary 
          : (data.dietary !== undefined ? data.dietary : user.value?.dietary)
      }
      return { success: true, data: user.value }
    } catch (err: any) {
      console.error('Error updating user profile:', err?.message || err)
      const message = err.data?.message || 'Не вдалося оновити профіль. Перевірте правильність введених даних.'
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  /**
   * DELETE /users/me
   * Deletes the user account, clears the session, and redirects to home.
   */
  const deleteAccount = async () => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const success = await $api<boolean>('/users/me', {
        method: 'DELETE'
      })
      if (success) {
        try {
          const { $api: api } = useNuxtApp()
          await api('/auth/logout', { method: 'POST' })
        } catch (e: any) {
          console.error('Secondary logout after deletion failed:', e?.message || e)
        }

        user.value = null
        if (import.meta.client) {
          // Manually clear any potential local cookies as well
          const cookieNames = ['jwt-access', 'jwt-refresh']
          cookieNames.forEach(name => {
            const c = useCookie(name)
            c.value = null
          })

          await navigateTo('/')
        }
      }
      return { success }
    } catch (err: any) {
      console.error('Error deleting account:', err?.message || err)
      const message = err.data?.message || 'Не вдалося видалити акаунт. Спробуйте пізніше.'
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  /**
   * GET /users/me/restrictions
   * Fetches the dietary and allergy restrictions of the current user.
   */
  const getRestrictions = async (): Promise<UserRestrictionsDto | null> => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const data = await $api<UserRestrictionsDto>('/users/me/restrictions')
      // Sync fetched restrictions directly into the global user state
      if (user.value) {
        user.value.allergies = data.allergies || []
        user.value.dietary = data.dietary || []
      }
      return data
    } catch (err: any) {
      console.error('Error fetching restrictions:', err?.message || err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * PATCH /users/me/password
   * Changes the current user's password.
   */
  const updatePassword = async (passwordDto: UpdatePasswordDto) => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const success = await $api<boolean>('/users/me/password', {
        method: 'PATCH',
        body: passwordDto
      })
      return { success }
    } catch (err: any) {
      console.error('Error changing password:', err?.message || err)
      const message = err.data?.message || 'Невірний старий пароль або новий пароль не відповідає вимогам безпеки.'
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  /**
   * GET /users/{id}
   * Fetches the public profile of any user by ID.
   */
  const getPublicProfile = async (id: string): Promise<UserPublicDto | null> => {
    loading.value = true
    try {
      const { $api } = useNuxtApp()
      const data = await $api<UserPublicDto>(`/users/${id}`)
      return data
    } catch (err: any) {
      console.error(`Error fetching public profile for user ${id}:`, err?.message || err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    fetchProfile,
    updateProfile,
    deleteAccount,
    getRestrictions,
    updatePassword,
    getPublicProfile
  }
}
