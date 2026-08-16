<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChatDto } from '~/types/chat'
import { useChat } from '~/composables/useChat'

interface Props {
  activeChatId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const toast = useToast()

const {
  chats,
  chatsMeta,
  isLoadingChats,
  createChat,
  updateChat,
  deleteChat,
  fetchChats,
  isSidebarOpen,
} = useChat()

// State
const searchQuery = ref('')
const editingChatId = ref<string | null>(null)
const editingTitle = ref('')
const deletingChatId = ref<string | null>(null)
const isDeleting = ref(false)
const isCreating = ref(false)

// Filtered chats by search
const filteredChats = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return chats.value
  return chats.value.filter(c =>
    (c.title || 'Новий чат').toLowerCase().includes(q),
  )
})

const hasMoreChats = computed(() => chatsMeta.value?.hasNextPage ?? false)

const isDeleteModalOpen = computed({
  get: () => !!deletingChatId.value,
  set: (v) => { if (!v) deletingChatId.value = null },
})

// Actions

const handleCreateChat = async () => {
  emit('close')
  await router.push('/chats')
}

const startEditing = (chat: ChatDto) => {
  editingChatId.value = chat.id
  editingTitle.value = chat.title || ''
}

const saveTitle = async (chatId: string) => {
  const trimmed = editingTitle.value.trim()
  if (!trimmed) {
    editingChatId.value = null
    return
  }
  try {
    await updateChat(chatId, { title: trimmed })
    toast.add({ title: 'Назву оновлено', color: 'success' })
  } catch {
    // Error handled in composable
  } finally {
    editingChatId.value = null
  }
}

const cancelEdit = () => {
  editingChatId.value = null
  editingTitle.value = ''
}

const confirmDelete = (chatId: string) => {
  deletingChatId.value = chatId
}

const handleDelete = async () => {
  if (!deletingChatId.value || isDeleting.value) return
  isDeleting.value = true
  const wasActive = deletingChatId.value === props.activeChatId
  try {
    await deleteChat(deletingChatId.value)
    toast.add({ title: 'Чат видалено', color: 'success' })
    if (wasActive) {
      await router.push('/chats')
    }
  } catch {
    // Error handled in composable
  } finally {
    isDeleting.value = false
    deletingChatId.value = null
  }
}

const loadMoreChats = async () => {
  if (!chatsMeta.value?.nextCursor) return
  await fetchChats(chatsMeta.value.nextCursor)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Сьогодні'
  if (diffDays === 1) return 'Вчора'
  if (diffDays < 7) return `${diffDays} дні тому`
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

const handleKeydown = (e: KeyboardEvent, chatId: string) => {
  if (e.key === 'Enter') saveTitle(chatId)
  if (e.key === 'Escape') cancelEdit()
}


</script>

<template>
  <aside class="flex flex-col h-full bg-white dark:bg-smak-neutral-900 border-r border-smak-neutral-100 dark:border-smak-neutral-800">
    <!-- Header -->
    <div class="shrink-0 p-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-heading font-bold text-base text-smak-neutral-700 dark:text-smak-neutral-200">
          Мої чати
        </h2>
        <div class="flex items-center gap-1">
          <!-- Create new chat -->
          <UButton
            id="sidebar-new-chat-btn"
            variant="ghost"
            color="neutral"
            size="xs"
            class="rounded-lg hover:bg-ai-indigo-50 dark:hover:bg-ai-indigo-950/30 hover:text-ai-indigo-500"
            :loading="isCreating"
            aria-label="Новий чат"
            @click="handleCreateChat"
          >
            <template #leading>
              <UIcon name="i-lucide-plus" class="w-5 h-5" />
            </template>
          </UButton>
          <!-- Close sidebar button -->
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            class="rounded-lg cursor-pointer"
            aria-label="Закрити панель"
            @click="isSidebarOpen = false; emit('close')"
          >
            <template #leading>
              <UIcon name="i-lucide-panel-left-close" class="w-5 h-5" />
            </template>
          </UButton>
        </div>
      </div>

      <!-- Search -->
      <div class="relative">
        <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-smak-neutral-400 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Пошук чату..."
          class="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-smak-neutral-50 dark:bg-smak-neutral-800 border border-smak-neutral-100 dark:border-smak-neutral-700 text-smak-neutral-700 dark:text-smak-neutral-200 placeholder-smak-neutral-400 focus:outline-none focus:ring-2 focus:ring-ai-indigo-400/30 focus:border-ai-indigo-300 dark:focus:border-ai-indigo-700 transition-all"
        />
      </div>
    </div>

    <!-- Chat list -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
      <div v-if="isLoadingChats && chats.length === 0" class="space-y-2 p-2">
        <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-smak-neutral-100 dark:bg-smak-neutral-800 animate-pulse" />
      </div>

      <template v-else-if="filteredChats.length > 0">
        <div
          v-for="chat in filteredChats"
          :key="chat.id"
          class="group relative"
        >
          <!-- Edit mode -->
          <div
            v-if="editingChatId === chat.id"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-ai-indigo-50 dark:bg-ai-indigo-950/20 border border-ai-indigo-200 dark:border-ai-indigo-900/40"
          >
            <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5 text-ai-indigo-500 shrink-0" />
            <input
              v-model="editingTitle"
              class="flex-1 min-w-0 text-xs bg-transparent text-smak-neutral-800 dark:text-smak-neutral-100 focus:outline-none placeholder-smak-neutral-400"
              placeholder="Назва чату..."
              autofocus
              maxlength="255"
              @keydown="handleKeydown($event, chat.id)"
            />
            <button class="text-ai-indigo-500 hover:text-ai-indigo-600 transition-colors" aria-label="Зберегти" @click="saveTitle(chat.id)">
              <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
            </button>
            <button class="text-smak-neutral-400 hover:text-smak-neutral-600 transition-colors" aria-label="Скасувати" @click="cancelEdit">
              <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Normal mode -->
          <NuxtLink
            v-else
            :to="`/chats/${chat.id}`"
            class="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group"
            :class="[
              activeChatId === chat.id
                ? 'bg-ai-indigo-50 dark:bg-ai-indigo-950/20 border border-ai-indigo-100 dark:border-ai-indigo-900/30'
                : 'hover:bg-smak-neutral-50 dark:hover:bg-smak-neutral-800/60'
            ]"
            @click="emit('close')"
          >
            <!-- Chat icon -->
            <div class="shrink-0">
              <UIcon
                :name="chat.isArchived ? 'i-lucide-archive' : 'i-lucide-message-circle'"
                class="w-5.5 h-5.5"
                :class="activeChatId === chat.id ? 'text-ai-indigo-500' : 'text-smak-neutral-400 dark:text-smak-neutral-500'"
              />
            </div>

            <!-- Title & meta -->
            <div class="flex-1 min-w-0">
              <p
                class="text-[15px] font-semibold truncate leading-tight"
                :class="activeChatId === chat.id
                  ? 'text-ai-indigo-600 dark:text-ai-indigo-400'
                  : 'text-smak-neutral-700 dark:text-smak-neutral-200'"
              >
                {{ chat.title || 'Новий чат' }}
              </p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="text-[13px] text-smak-neutral-400 dark:text-smak-neutral-500">
                  {{ formatDate(chat.updatedAt) }}
                </span>
              </div>
            </div>

            <!-- Action buttons -->
            <div
              class="shrink-0 flex items-center gap-0.5"
              @click.stop.prevent
            >
              <button
                class="p-1 rounded-lg text-smak-neutral-400 hover:text-smak-neutral-600 dark:hover:text-smak-neutral-200 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-700 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Перейменувати"
                @click="startEditing(chat)"
              >
                <UIcon name="i-lucide-pencil" class="w-4.5 h-4.5" />
              </button>
              <button
                class="p-1 rounded-lg text-red-500 dark:text-red-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                aria-label="Видалити"
                @click="confirmDelete(chat.id)"
              >
                <UIcon name="i-lucide-trash-2" class="w-4.5 h-4.5" />
              </button>
            </div>
          </NuxtLink>
        </div>

        <!-- Load more -->
        <div v-if="hasMoreChats" class="pt-2 px-2">
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            class="w-full rounded-xl text-xs"
            :loading="isLoadingChats"
            @click="loadMoreChats"
          >
            Завантажити ще
          </UButton>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">
        <div class="w-10 h-10 rounded-full bg-smak-neutral-100 dark:bg-smak-neutral-800 flex items-center justify-center">
          <UIcon name="i-lucide-message-square-dashed" class="w-5 h-5 text-smak-neutral-400" />
        </div>
        <p class="text-xs text-smak-neutral-400 dark:text-smak-neutral-500 leading-relaxed">
          {{ searchQuery ? 'Чат не знайдено' : 'Поки немає чатів' }}
        </p>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <UModal
      v-model:open="isDeleteModalOpen"
      title="Видалити чат?"
      :ui="{ footer: 'flex justify-end gap-2' }"
    >
      <template #body>
        <p class="text-sm text-smak-neutral-600 dark:text-smak-neutral-400">
          Всі повідомлення буде втрачено. Цю дію не можна скасувати.
        </p>
      </template>
      <template #footer>
        <UButton variant="ghost" color="neutral" label="Скасувати" @click="deletingChatId = null" />
        <UButton
          color="error"
          label="Видалити"
          :loading="isDeleting"
          @click="handleDelete"
        />
      </template>
    </UModal>
  </aside>
</template>
