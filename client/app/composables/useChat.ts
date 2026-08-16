import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useBilling } from '~/composables/useBilling'
import type {
  ChatDto,
  ChatMessageDto,
  ChatCursorMeta,
  ChatListResponse,
  ChatMessagesResponse,
  CreateChatDto,
  UpdateChatDto,
  SendMessageDto,
  ChatMessageMetadataDto,
} from '~/types/chat'



export const useChat = () => {
  const { $api } = useNuxtApp()
  const toast = useToast()
  const config = useRuntimeConfig()
  const { triggerUpgradeModal, activePlan } = useBilling()

  // SSR-safe states
  const chats = useState<ChatDto[]>('chat-list', () => [])
  const chatsMeta = useState<ChatCursorMeta | null>('chat-list-meta', () => null)
  const currentChat = useState<ChatDto | null>('chat-current', () => null)
  const messages = useState<ChatMessageDto[]>('chat-messages', () => [])
  const messagesMeta = useState<ChatCursorMeta | null>('chat-messages-meta', () => null)

  const isLoadingChats = useState<boolean>('chat-loading-list', () => false)
  const isLoadingChat = useState<boolean>('chat-loading-item', () => false)
  const isLoadingMessages = useState<boolean>('chat-loading-messages', () => false)

  const isStreaming = useState<boolean>('chat-streaming', () => false)
  const streamingContent = useState<string>('chat-streaming-content', () => '')
  const streamingMetadata = useState<ChatMessageMetadataDto | null>('chat-streaming-metadata', () => null)

  const isSidebarOpen = useState<boolean>('chat-sidebar-open', () => false)
  const isMobileSidebarOpen = useState<boolean>('chat-mobile-sidebar-open', () => false)
  const isNewChatJustCreated = useState<boolean>('chat-new-just-created', () => false)
  const isAiLimitReached = useState<boolean>('chat-ai-limit-reached', () => false)

  // Reset limit state automatically when active plan changes (e.g. user upgrades to PRO/PREMIUM)
  if (import.meta.client) {
    watch(activePlan, () => {
      isAiLimitReached.value = false
    })
  }

  // Chats list

  /**
   * Fetch paginated chat list (cursor-based).
   * Pass cursor=null to start from beginning.
   */
  const fetchChats = async (cursor?: string | null, limit = 10) => {
    isLoadingChats.value = true
    try {
      const query: Record<string, any> = { limit }
      if (cursor) query.cursor = cursor

      const response = await $api<ChatListResponse>('/chats', { method: 'GET', query })

      if (cursor) {
        // Append next page
        chats.value = [...chats.value, ...response.data]
      } else {
        // First page or refresh
        chats.value = response.data
      }
      chatsMeta.value = response.meta
      return response
    } catch (err: any) {
      console.error('Error fetching chats:', err)
      toast.add({
        title: 'Помилка',
        description: err.data?.message || 'Не вдалося завантажити чати',
        color: 'error',
      })
      throw err
    } finally {
      isLoadingChats.value = false
    }
  }

  /**
   * Fetch a single chat by ID.
   */
  const fetchChatById = async (id: string) => {
    isLoadingChat.value = true
    try {
      const data = await $api<ChatDto>(`/chats/${id}`)
      currentChat.value = data
      return data
    } catch (err: any) {
      console.error(`Error fetching chat ${id}:`, err)
      throw err
    } finally {
      isLoadingChat.value = false
    }
  }

  /**
   * Create a new chat and redirect to it.
   */
  const createChat = async (dto: CreateChatDto = {}) => {
    try {
      const data = await $api<ChatDto>('/chats', {
        method: 'POST',
        body: dto,
      })
      // Prepend to list
      chats.value = [data, ...chats.value]
      return data
    } catch (err: any) {
      console.error('Error creating chat:', err)
      toast.add({
        title: 'Помилка',
        description: err.data?.message || 'Не вдалося створити чат',
        color: 'error',
      })
      throw err
    }
  }

  /**
   * Update chat title, archived state or summary.
   */
  const updateChat = async (id: string, dto: UpdateChatDto) => {
    try {
      const data = await $api<ChatDto>(`/chats/${id}`, {
        method: 'PUT',
        body: dto,
      })
      // Update in local list
      const idx = chats.value.findIndex(c => c.id === id)
      if (idx !== -1) chats.value[idx] = data
      if (currentChat.value?.id === id) currentChat.value = data
      return data
    } catch (err: any) {
      console.error(`Error updating chat ${id}:`, err)
      toast.add({
        title: 'Помилка',
        description: err.data?.message || 'Не вдалося оновити чат',
        color: 'error',
      })
      throw err
    }
  }

  /**
   * Delete a chat and remove it from the local list.
   */
  const deleteChat = async (id: string) => {
    try {
      await $api(`/chats/${id}`, { method: 'DELETE' })
      chats.value = chats.value.filter(c => c.id !== id)
      if (currentChat.value?.id === id) currentChat.value = null
    } catch (err: any) {
      console.error(`Error deleting chat ${id}:`, err)
      toast.add({
        title: 'Помилка',
        description: err.data?.message || 'Не вдалося видалити чат',
        color: 'error',
      })
      throw err
    }
  }

  // Messages

  /**
   * Fetch messages for a chat with cursor-based pagination.
   * Pass cursor=null to start from beginning (latest batch).
   */
  const fetchMessages = async (chatId: string, cursor?: string | null, limit = 10) => {
    isLoadingMessages.value = true
    try {
      const query: Record<string, any> = { limit }
      if (cursor) query.cursor = cursor

      const response = await $api<ChatMessagesResponse>(`/chats/${chatId}/messages`, {
        method: 'GET',
        query,
      })

      if (cursor) {
        // Prepend older messages to the top
        messages.value = [...response.data, ...messages.value]
      } else {
        if (!isStreaming.value) {
          messages.value = response.data
        }
      }
      messagesMeta.value = response.meta
      return response
    } catch (err: any) {
      console.error(`Error fetching messages for chat ${chatId}:`, err)
      toast.add({
        title: 'Помилка',
        description: err.data?.message || 'Не вдалося завантажити повідомлення',
        color: 'error',
      })
      throw err
    } finally {
      isLoadingMessages.value = false
    }
  }

  /**
   * Stream a message via SSE using @microsoft/fetch-event-source.
   * Handles: text_chunk | metadata | done | error events.
   */
  const streamMessage = async (
    chatId: string,
    dto: SendMessageDto,
    accessToken?: string,
  ) => {
    if (isStreaming.value) return

    // 1. Optimistically add user message bubble
    const tempUserMsgId = `temp-user-${Date.now()}`
    const userMsg: ChatMessageDto = {
      id: tempUserMsgId,
      role: 'user',
      content: dto.text,
      createdAt: new Date().toISOString(),
      metadata: null,
    }
    messages.value = [...messages.value, userMsg]

    // 2. Reset streaming state
    isStreaming.value = true
    streamingContent.value = ''
    streamingMetadata.value = null
    const apiUrl = (config.public.apiUrl as string) || 'http://localhost:4000'

    return new Promise<void>((resolve, reject) => {
      const controller = new AbortController()

      fetchEventSource(`${apiUrl}/chats/${chatId}/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dto),
        signal: controller.signal,
        openWhenHidden: true,

        onopen: async (response) => {
          if (response.status === 403) {
            isAiLimitReached.value = true
            triggerUpgradeModal('chat')
            throw new Error('Daily AI request limit reached')
          }
          if (!response.ok) {
            const errorText = await response.text()
            console.error('SSE connection failed:', response.status, errorText)
            throw new Error(`SSE connection failed: ${response.status}`)
          }
        },

        onmessage: (event) => {
          const { event: eventType, data } = event

          if (eventType === 'text_chunk') {
            streamingContent.value += data

          } else if (eventType === 'stream_reset') {
            streamingContent.value = ''
            streamingMetadata.value = null

          } else if (eventType === 'metadata') {
            try {
              const newMetadata = JSON.parse(data) as ChatMessageMetadataDto
              if (!streamingMetadata.value) {
                streamingMetadata.value = newMetadata
              } else {
                const merged = { ...streamingMetadata.value, ...newMetadata }

                // Merge and de-duplicate recipes if both exist
                if (streamingMetadata.value.recipes && newMetadata.recipes) {
                  const recipeMap = new Map<string, any>()
                  for (const r of [...streamingMetadata.value.recipes, ...newMetadata.recipes]) {
                    recipeMap.set(r.id, r)
                  }
                  merged.recipes = Array.from(recipeMap.values())
                } else if (streamingMetadata.value.recipes) {
                  merged.recipes = [...streamingMetadata.value.recipes]
                } else if (newMetadata.recipes) {
                  merged.recipes = [...newMetadata.recipes]
                }

                streamingMetadata.value = merged
              }
            } catch (e) {
              console.warn('Failed to parse metadata:', data)
            }

          } else if (eventType === 'done') {
            // Commit the completed AI message to the messages list
            const aiMsg: ChatMessageDto = {
              id: `ai-${Date.now()}`,
              role: 'model',
              content: streamingContent.value,
              createdAt: new Date().toISOString(),
              metadata: streamingMetadata.value,
            }
            messages.value = [...messages.value, aiMsg]

            // Update chat message count in sidebar list
            const idx = chats.value.findIndex(c => c.id === chatId)
            if (idx !== -1 && chats.value[idx]) {
              chats.value[idx] = {
                ...chats.value[idx]!,
                messageCount: (chats.value[idx]!.messageCount || 0) + 2,
                updatedAt: new Date().toISOString(),
              }
            }
            if (currentChat.value?.id === chatId) {
              currentChat.value = {
                ...currentChat.value,
                messageCount: (currentChat.value.messageCount || 0) + 2,
              }
            }

            isStreaming.value = false
            streamingContent.value = ''
            streamingMetadata.value = null
            controller.abort()
            resolve()

          } else if (eventType === 'error') {
            console.error('SSE error event:', data)
            isStreaming.value = false
            streamingContent.value = ''
            streamingMetadata.value = null
            if (data && (data.includes('limit reached') || data.includes('Daily AI request limit') || data.includes('403'))) {
              isAiLimitReached.value = true
              triggerUpgradeModal('chat')
            } else {
              toast.add({
                title: 'Помилка AI',
                description: data || 'Не вдалося отримати відповідь від асистента',
                color: 'error',
              })
            }
            controller.abort()
            reject(new Error(data))
          }
        },

        onerror: (err) => {
          console.error('SSE onerror:', err)
          isStreaming.value = false
          streamingContent.value = ''
          streamingMetadata.value = null

          const errorMsg = err?.message || String(err)
          if (errorMsg.includes('limit reached') || errorMsg.includes('Daily AI request limit') || errorMsg.includes('403')) {
            isAiLimitReached.value = true
            triggerUpgradeModal('chat')
            reject(err)
            throw err
          }

          toast.add({
            title: 'Помилка з\'єднання',
            description: 'Втрачено з\'єднання з ШІ-асистентом',
            color: 'error',
          })
          reject(err)
          // Return to prevent auto-reconnect
          throw err
        },
      })
    })
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Reset messages state when leaving a chat page.
   */
  const resetMessages = () => {
    messages.value = []
    messagesMeta.value = null
    currentChat.value = null
    streamingContent.value = ''
    streamingMetadata.value = null
    isStreaming.value = false
  }

  /**
   * Reset AI limit reached flag manually.
   */
  const resetAiLimitReached = () => {
    isAiLimitReached.value = false
  }

  /**
   * Clear entire chat state (e.g. on logout)
   */
  const clearChatState = () => {
    chats.value = []
    chatsMeta.value = null
    currentChat.value = null
    messages.value = []
    messagesMeta.value = null
    isLoadingChats.value = false
    isLoadingChat.value = false
    isLoadingMessages.value = false
    isStreaming.value = false
    streamingContent.value = ''
    streamingMetadata.value = null
    isNewChatJustCreated.value = false
    isAiLimitReached.value = false
  }

  return {
    // State
    chats,
    chatsMeta,
    currentChat,
    messages,
    messagesMeta,
    isLoadingChats,
    isLoadingChat,
    isLoadingMessages,
    isSidebarOpen,
    isMobileSidebarOpen,
    isStreaming,
    streamingContent,
    streamingMetadata,
    isNewChatJustCreated,
    isAiLimitReached,
    // Actions
    fetchChats,
    fetchChatById,
    createChat,
    updateChat,
    deleteChat,
    fetchMessages,
    streamMessage,
    resetMessages,
    resetAiLimitReached,
    clearChatState,
  }
}
