import { useBilling } from '~/composables/useBilling'
import type {
  RecipeCollectionResponseDto,
  CreateCollectionDto,
  UpdateCollectionDto
} from '~/types/collection'



export const useCollections = () => {
  const { $api } = useNuxtApp()
  const toast = useToast()

  const recipeToCollectionsMap = useState<Record<string, string[]>>('recipeToCollectionsMap', () => ({}))
  const collectionsList = useState<RecipeCollectionResponseDto[]>('collectionsList', () => [])
  const isInitialized = useState<boolean>('collectionsIsInitialized', () => false)
  const isInitializing = useState<boolean>('collectionsIsInitializing', () => false)

  const refreshCollectionsMap = async () => {
    if (isInitializing.value) return
    isInitializing.value = true

    try {
      const collections = await $api<RecipeCollectionResponseDto[]>('/recipe-collections')
      collectionsList.value = collections

      const newMap: Record<string, string[]> = {}

      await Promise.all(collections.map(async (c) => {
        if (c.recipesCount > 0) {
          try {
            const detail = await $api<RecipeCollectionResponseDto>(`/recipe-collections/${c.id}`)
            if (detail?.recipes && Array.isArray(detail.recipes)) {
              detail.recipes.forEach(r => {
                const recipeId = r.id
                if (!newMap[recipeId]) {
                  newMap[recipeId] = []
                }
                const collectionIds = newMap[recipeId]
                if (collectionIds && !collectionIds.includes(c.id)) {
                  collectionIds.push(c.id)
                }
              })
            }
          } catch (e) {
            console.error(`Failed to fetch collection ${c.id}`, e)
          }
        }
      }))

      recipeToCollectionsMap.value = newMap
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to refresh collections map', error)
    } finally {
      isInitializing.value = false
    }
  }

  const getCollections = async () => {
    try {
      const data = await $api<RecipeCollectionResponseDto[]>('/recipe-collections')
      collectionsList.value = data
      return data
    } catch (error) {
      toast.add({
        title: 'Помилка',
        description: 'Не вдалося завантажити колекції',
        color: 'error'
      })
      return []
    }
  }

  const getCollection = async (id: string) => {
    try {
      return await $api<RecipeCollectionResponseDto>(`/recipe-collections/${id}`)
    } catch (error) {
      toast.add({
        title: 'Помилка',
        description: 'Не вдалося завантажити деталі колекції',
        color: 'error'
      })
      throw error
    }
  }

  const createCollection = async (dto: CreateCollectionDto) => {
    const { currentPlanConfig, triggerUpgradeModal, fetchSubscription } = useBilling()
    const currentCount = collectionsList.value.length

    if (currentCount >= currentPlanConfig.value.features.maxCollections) {
      // Fetch latest subscription to ensure we are not using stale limits
      await fetchSubscription()

      if (currentCount >= currentPlanConfig.value.features.maxCollections) {
        triggerUpgradeModal('collections')
        const error = new Error('Limit reached')
        throw error
      }
    }

    try {
      const collection = await $api<RecipeCollectionResponseDto>('/recipe-collections', {
        method: 'POST',
        body: dto
      })
      toast.add({
        title: 'Успіх',
        description: 'Колекцію створено',
        color: 'success'
      })
      await refreshCollectionsMap()
      return collection
    } catch (error: any) {
      const description = error.status === 403
        ? 'Досягнуто ліміт підписки для створення колекцій'
        : 'Не вдалося створити колекцію'

      toast.add({
        title: 'Помилка',
        description,
        color: 'error'
      })
      throw error
    }
  }

  const updateCollection = async (id: string, dto: UpdateCollectionDto) => {
    try {
      const collection = await $api<RecipeCollectionResponseDto>(`/recipe-collections/${id}`, {
        method: 'PATCH',
        body: dto
      })
      toast.add({
        title: 'Успіх',
        description: 'Колекцію оновлено',
        color: 'success'
      })
      return collection
    } catch (error) {
      toast.add({
        title: 'Помилка',
        description: 'Не вдалося оновити колекцію',
        color: 'error'
      })
      throw error
    }
  }

  const deleteCollection = async (id: string) => {
    try {
      await $api(`/recipe-collections/${id}`, {
        method: 'DELETE'
      })
      toast.add({
        title: 'Успіх',
        description: 'Колекцію видалено',
        color: 'success'
      })
      await refreshCollectionsMap()
    } catch (error: any) {
      const description = error.status === 400
        ? 'Неможливо видалити системну колекцію'
        : 'Не вдалося видалити колекцію'

      toast.add({
        title: 'Помилка',
        description,
        color: 'error'
      })
      throw error
    }
  }

  const addRecipeToCollection = async (collectionId: string, recipeId: string) => {
    try {
      await $api(`/recipe-collections/${collectionId}/recipes/${recipeId}`, {
        method: 'POST'
      })

      // Update local map optimistically
      const current = recipeToCollectionsMap.value[recipeId] || []
      if (!current.includes(collectionId)) {
        recipeToCollectionsMap.value[recipeId] = [...current, collectionId]
      }

      toast.add({
        title: 'Успіх',
        description: 'Рецепт додано до колекції',
        color: 'success'
      })
    } catch (error) {
      toast.add({
        title: 'Помилка',
        description: 'Не вдалося додати рецепт до колекції',
        color: 'error'
      })
      throw error
    }
  }

  const removeRecipeFromCollection = async (collectionId: string, recipeId: string) => {
    try {
      await $api(`/recipe-collections/${collectionId}/recipes/${recipeId}`, {
        method: 'DELETE'
      })

      // Update local map optimistically
      const current = recipeToCollectionsMap.value[recipeId] || []
      recipeToCollectionsMap.value[recipeId] = current.filter(id => id !== collectionId)

      toast.add({
        title: 'Успіх',
        description: 'Рецепт видалено з колекції',
        color: 'success'
      })
    } catch (error) {
      toast.add({
        title: 'Помилка',
        description: 'Не вдалося видалити рецепт з колекції',
        color: 'error'
      })
      throw error
    }
  }

  const removeRecipeFromAllCollections = async (recipeId: string) => {
    const collections = recipeToCollectionsMap.value[recipeId] || []
    if (collections.length === 0) return

    try {
      await Promise.all(collections.map(cId =>
        $api(`/recipe-collections/${cId}/recipes/${recipeId}`, { method: 'DELETE' })
      ))

      recipeToCollectionsMap.value[recipeId] = []

      toast.add({
        title: 'Успіх',
        description: 'Рецепт видалено з усіх колекцій',
        color: 'success'
      })
    } catch (error) {
      toast.add({
        title: 'Помилка',
        description: 'Помилка при видаленні рецепту',
        color: 'error'
      })
    }
  }

  const isRecipeInAnyCollection = (recipeId: string) => {
    return (recipeToCollectionsMap.value[recipeId]?.length || 0) > 0
  }

  // Initialize map if needed
  const initCollections = async () => {
    if (!isInitialized.value && !isInitializing.value) {
      await refreshCollectionsMap()
    }
  }

  const clearCollections = () => {
    recipeToCollectionsMap.value = {}
    collectionsList.value = []
    isInitialized.value = false
    isInitializing.value = false
  }

  return {
    collectionsList,
    recipeToCollectionsMap,
    getCollections,
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addRecipeToCollection,
    removeRecipeFromCollection,
    removeRecipeFromAllCollections,
    isRecipeInAnyCollection,
    initCollections,
    refreshCollectionsMap,
    clearCollections
  }
}
