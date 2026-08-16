import type { UserPrivateDto, UpdateUserAdminDto, UserAdminSearchResponse } from '~/types/user'

export const useAdminUsers = () => {
  const { $api } = useNuxtApp()

  const users = useState<UserPrivateDto[]>('admin-users-list', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = useState<{
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  } | null>('admin-users-meta', () => null)

  /**
   * Fetch users for admin with pagination and filtering.
   */
  const fetchUsers = async (query?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    role?: 'user' | 'admin'; 
    isBanned?: boolean; 
    isVerified?: boolean; 
  }) => {
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

      const response = await $api<UserAdminSearchResponse>('/admin/users', {
        method: 'GET',
        query: cleanParams,
      })

      users.value = response.data || []
      meta.value = response.meta || null
    } catch (err: any) {
      console.error('Error fetching admin users:', err)
      error.value = err.data?.message || 'Помилка при завантаженні користувачів.'
      users.value = []
      meta.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single user by ID (admin).
   */
  const fetchUser = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<UserPrivateDto>(`/admin/users/${id}`, {
        method: 'GET',
      })
      return response
    } catch (err: any) {
      console.error(`Error fetching user ${id}:`, err)
      error.value = err.data?.message || 'Помилка при завантаженні профілю користувача.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user details (admin).
   */
  const updateUser = async (id: string, body: UpdateUserAdminDto) => {
    loading.value = true
    error.value = null
    try {
      const response = await $api<UserPrivateDto>(`/admin/users/${id}`, {
        method: 'PUT',
        body,
      })

      // Update local state if the user is in the list
      const idx = users.value.findIndex(u => u.id === id)
      if (idx !== -1) {
        users.value[idx] = { ...users.value[idx], ...response }
      }

      return response
    } catch (err: any) {
      console.error(`Error updating user ${id}:`, err)
      error.value = err.data?.message || 'Помилка при оновленні користувача.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete user account (admin).
   */
  const deleteUser = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await $api(`/admin/users/${id}`, {
        method: 'DELETE',
      })

      // Remove from local list
      users.value = users.value.filter(u => u.id !== id)
      return true
    } catch (err: any) {
      console.error(`Error deleting user ${id}:`, err)
      error.value = err.data?.message || 'Помилка при видаленні користувача.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    meta,
    fetchUsers,
    fetchUser,
    updateUser,
    deleteUser,
  }
}
