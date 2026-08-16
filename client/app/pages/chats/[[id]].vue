<!--
@page-docs
title: Interactive AI assistant (Chat)
description: Page for communicating with the smart culinary AI assistant of the SMAK platform. Allows the user to receive advice, adapt recipes to their own products or diet, and quickly switch to cooking dishes.
features:
  - Real-time AI communication: receiving culinary advice, cooking instructions, automatic ingredient replacement.
  - Chat sidebar: history of all user dialogues, creation of new chats, quick switching between existing sessions.
  - Chat management: ability to rename dialogue, archive outdated chats or delete them completely.
  - Integration with recipes: if the chat is linked to a specific recipe, quick buttons are available to go to the recipe details page (/recipes/:id) or start the step-by-step cooking mode (Cook Mode: /recipes/cook/:id).
  - Quick tips: a set of popular clickable queries ("What to cook for dinner?", "Borscht recipe", etc.) for a quick start to the dialogue.
  - Archive mode: a warning that the chat is archived (sending new messages is blocked, read-only mode available).
-->

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useChat } from '~/composables/useChat'
import { useUser } from '~/composables/useUser'
import type { ChatMessageDto } from '~/types/chat'

const { getRestrictions, user } = useUser()

const loadRestrictions = async () => {
  if (user.value && (!user.value.allergies || !user.value.dietary)) {
    const res = await getRestrictions()
    if (res && user.value) {
      user.value.allergies = res.allergies || []
      user.value.dietary = res.dietary || []
    }
  }
}

definePageMeta({
  middleware: ['auth'],
  layout: 'chat',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Optional ID param
const chatId = computed(() => route.params.id as string | undefined)

const {
  chats,
  currentChat,
  messages,
  messagesMeta,
  isLoadingChat,
  isLoadingMessages,
  isStreaming,
  streamingContent,
  streamingMetadata,
  isNewChatJustCreated,
  isAiLimitReached,
  fetchChatById,
  fetchChats,
  fetchMessages,
  createChat,
  updateChat,
  deleteChat,
  streamMessage,
  resetMessages,
  isSidebarOpen,
  isMobileSidebarOpen,
} = useChat()


// UI State
const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isLoadingOlderMessages = ref(false)
const isEditingTitle = ref(false)
const editingTitle = ref('')
const isDeletingConfirm = ref(false)
const isDeletingChat = ref(false)

const isChatHistoryModalOpen = ref(false)
const chatSearchQuery = ref('')

const filteredChats = computed(() => {
  if (!chats.value) return []
  if (!chatSearchQuery.value.trim()) return chats.value
  const q = chatSearchQuery.value.toLowerCase()
  return chats.value.filter(c => c.title?.toLowerCase().includes(q))
})

const formatChatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays === 0 && now.getDate() === date.getDate()) return 'Сьогодні'
  if (diffDays <= 1) return 'Учора'
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

// Computed
useSeoMeta({
  title: computed(() => `Smak | ${currentChat.value?.title || 'Чати з асистентом'}`),
})

const canSend = computed(() => messageInput.value.trim().length > 0 && !isStreaming.value)
const hasOlderMessages = computed(() => messagesMeta.value?.hasNextPage ?? false)

// Streaming message shown as a fake bubble
const streamingMessage = computed((): ChatMessageDto | null => {
  if (!isStreaming.value && !streamingContent.value) return null
  return {
    id: 'streaming-message',
    role: 'model',
    content: streamingContent.value,
    createdAt: new Date().toISOString(),
    metadata: streamingMetadata.value,
  }
})

// Init 
onMounted(async () => {
  if (user.value) {
    loadRestrictions()
  }
  if (isStreaming.value) return
  
  if (isNewChatJustCreated.value) {
    isNewChatJustCreated.value = false
    if (chatId.value) {
      await fetchChatById(chatId.value)
    }
    // Always load sidebar chats if empty
    if (chats.value.length === 0) {
      await fetchChats()
    }
    await nextTick()
    scrollToBottom('instant')
    return
  }

  resetMessages()
  
  // Only fetch if we have an active chat ID
  if (chatId.value) {
    await Promise.all([
      fetchChatById(chatId.value),
      fetchMessages(chatId.value),
    ])
  }
  
  // Always load sidebar chats if empty
  if (chats.value.length === 0) {
    await fetchChats()
  }
  
  await nextTick()
  scrollToBottom('instant')
})

onBeforeUnmount(() => {
  resetMessages()
})

// Re-init when chatId changes (navigating between chats)
watch(chatId, async (newId) => {
  if (isStreaming.value) return
  
  if (isNewChatJustCreated.value) {
    isNewChatJustCreated.value = false
    if (newId) {
      await fetchChatById(newId)
    }
    return
  }

  resetMessages()
  if (!newId) {
    scrollToBottom('instant')
    return
  }
  await Promise.all([
    fetchChatById(newId),
    fetchMessages(newId),
  ])
  await nextTick()
  scrollToBottom('instant')
})

// Auto-scroll on new messages or streaming
watch(
  () => messages.value.length,
  () => nextTick(() => scrollToBottom()),
)
watch(streamingContent, () => nextTick(() => scrollToBottom()))

// Scroll
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  if (!messagesContainer.value) return
  const el = messagesContainer.value
  el.scrollTo({ top: el.scrollHeight, behavior })
}

const handleScroll = async () => {
  if (!messagesContainer.value || !chatId.value) return
  const el = messagesContainer.value
  // If near top, load older messages
  if (el.scrollTop < 100 && hasOlderMessages.value && !isLoadingOlderMessages.value) {
    isLoadingOlderMessages.value = true
    const prevHeight = el.scrollHeight
    await fetchMessages(chatId.value, messagesMeta.value?.nextCursor)
    await nextTick()
    // Restore scroll position
    el.scrollTop = el.scrollHeight - prevHeight
    isLoadingOlderMessages.value = false
  }
}

// Messaging
const handleSend = async () => {
  const text = messageInput.value.trim()
  if (!text || isStreaming.value) return

  messageInput.value = ''
  autoResize()

  try {
    let activeChatId = chatId.value
    
    // Lazy chat creation on first message
    if (!activeChatId) {
      isNewChatJustCreated.value = true
      // Generate title from first few words (up to 30 chars)
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text
      const newChat = await createChat({ title })
      activeChatId = newChat.id
    }

    // Update URL first if it's a new chat
    if (!chatId.value) {
      await router.push(`/chats/${activeChatId}`)
    }

    // Start streaming after URL is updated
    await streamMessage(activeChatId, { text })
  } catch (err) {
    console.error('Stream message error:', err)
    isNewChatJustCreated.value = false
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 180)}px`
}

// Chat Management (Modal editing & deletion)
const editingChatId = ref<string | null>(null)
const modalEditingTitle = ref('')
const chatToDelete = ref<any | null>(null)

const startEditChatInModal = (chat: any, e?: Event) => {
  if (e) e.stopPropagation()
  editingChatId.value = chat.id
  modalEditingTitle.value = chat.title || ''
}

const saveChatInModal = async (chat: any, e?: Event) => {
  if (e) e.stopPropagation()
  if (!editingChatId.value) return
  const trimmed = modalEditingTitle.value.trim()
  editingChatId.value = null
  if (!trimmed || trimmed === chat.title) return
  try {
    await updateChat(chat.id, { title: trimmed })
    toast.add({ title: 'Назву оновлено', color: 'success' })
  } catch {}
}

const openDeleteChatModal = (chat: any, e?: Event) => {
  if (e) e.stopPropagation()
  chatToDelete.value = chat
  isDeletingConfirm.value = true
}

const confirmDeleteChat = async () => {
  if (!chatToDelete.value && !chatId.value) return
  const targetId = chatToDelete.value?.id || chatId.value
  isDeletingChat.value = true
  try {
    await deleteChat(targetId)
    toast.add({ title: 'Чат видалено', color: 'success' })
    if (chatId.value === targetId) {
      await router.push('/chats')
    }
  } catch {}
  isDeletingChat.value = false
  isDeletingConfirm.value = false
  chatToDelete.value = null
}


</script>

<template>
  <div class="chats-page-root flex flex-col flex-1 min-h-0 w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">

    <div
      id="chats-page"
      class="flex flex-1 overflow-hidden h-full relative"
    >
      <!-- ───── Main Chat Area ───── -->
      <div class="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        <!-- ───── Messages Area ───── -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto custom-scrollbar py-6 flex flex-col"
          @scroll="handleScroll"
        >
          <div 
            class="max-w-3xl mx-auto w-full px-3.5 sm:px-0 flex-1 flex flex-col"
            :class="[messages.length === 0 && !isLoadingMessages ? 'justify-center items-center h-full' : 'space-y-6']"
          >
            <div v-if="isLoadingOlderMessages" class="flex justify-center w-full">
              <div class="flex items-center gap-2 text-xs text-smak-neutral-400 dark:text-smak-neutral-500">
                <div class="w-4 h-4 border-2 border-ai-indigo-400 border-t-transparent rounded-full animate-spin" />
                Завантаження...
              </div>
            </div>

            <!-- Loading skeleton -->
            <div v-if="isLoadingMessages && messages.length === 0" class="space-y-6 w-full">
              <div v-for="i in 3" :key="i" class="flex gap-3" :class="i % 2 === 0 ? 'flex-row-reverse' : ''">
                <div class="w-8 h-8 rounded-full bg-smak-neutral-100 dark:bg-smak-neutral-800 animate-pulse shrink-0" />
                <div class="flex flex-col gap-2" :class="i % 2 === 0 ? 'items-end' : ''">
                  <div
                    class="h-12 rounded-2xl bg-smak-neutral-100 dark:bg-smak-neutral-800 animate-pulse"
                    :style="{ width: `${160 + i * 40}px` }"
                  />
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="!isLoadingMessages && messages.length === 0 && !isStreaming"
              class="flex flex-col items-center justify-center text-center gap-3 max-w-2xl px-4 w-full -mt-16 sm:-mt-24 pb-8"
            >
              <div class="flex items-center justify-center mb-1">
                <UIcon 
                  name="i-lucide-sparkles" 
                  class="w-11 h-11 text-ai-indigo-500 dark:text-ai-indigo-400 filter drop-shadow-xs" 
                />
              </div>
              <div class="space-y-1.5">
                <h2 class="font-heading font-extrabold text-xl sm:text-2xl text-smak-neutral-900 dark:text-white">
                  Привіт! Я ваш кулінарний асистент
                </h2>
                <p class="text-sm sm:text-base text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed max-w-md mx-auto">
                  Запитайте про будь-який рецепт, кулінарну техніку або попросіть надихнути вас на нову страву
                </p>
              </div>
            </div>

            <!-- Messages list -->
            <template v-else>
              <ChatMessageBubble
                v-for="msg in messages"
                :key="msg.id"
                :message="msg"
              />

              <!-- Streaming bubble -->
              <div v-if="isStreaming" class="flex gap-3 w-full">
                <div class="flex flex-col gap-2 w-full">
                  <ChatTypingIndicator v-if="!streamingContent" />
                  <ChatMessageBubble
                    v-else
                    :message="streamingMessage!"
                    :is-streaming="true"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- ───── Input Area ───── -->
        <div class="shrink-0 w-full bg-smak-neutral-50/80 dark:bg-smak-neutral-950/80 backdrop-blur-xl border-t border-smak-neutral-100 dark:border-smak-neutral-900/50 pt-2.5 pb-2 px-3 sm:px-4 z-20">
          <div class="max-w-3xl mx-auto">
            <!-- AI Limit Reached Warning Banner -->
            <div
              v-if="isAiLimitReached"
              class="flex items-center justify-between gap-3 mb-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-2xs animate-fade-in"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <UIcon name="i-lucide-zap-off" class="w-4.5 h-4.5" />
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-heading font-bold text-xs sm:text-sm text-smak-neutral-900 dark:text-white truncate">
                    Ліміт ШІ-запитів вичерпано
                  </span>
                  <span class="text-[11px] sm:text-xs text-smak-neutral-500 dark:text-smak-neutral-400 truncate">
                    Оновіть тариф для безлімітного спілкування
                  </span>
                </div>
              </div>
              <NuxtLink
                to="/billing/plans"
                class="shrink-0 px-3.5 py-1.5 rounded-xl bg-brand-gradient text-white font-bold text-xs shadow-xs hover:scale-105 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Тарифи</span>
                <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
              </NuxtLink>
            </div>

            <!-- Archived warning -->
            <div
              v-else-if="currentChat?.isArchived && chatId"
              class="flex items-center gap-2 mb-2 px-4 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 text-xs text-yellow-700 dark:text-yellow-400"
            >
              <UIcon name="i-lucide-archive" class="w-4 h-4 shrink-0" />
              <span>Цей чат архівовано. Ви можете читати повідомлення, але не можете надсилати нові.</span>
            </div>

            <!-- Input wrapper + History Button (Height: 50px, Tight Gap: gap-2) -->
            <div class="flex items-center gap-2">
              <div
                class="flex-1 flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full border transition-all duration-200 bg-white dark:bg-smak-neutral-800/60 h-[50px]"
                :class="isAiLimitReached || (currentChat?.isArchived && chatId)
                  ? 'border-smak-neutral-100 dark:border-smak-neutral-800 opacity-60 pointer-events-none'
                  : 'border-smak-neutral-200 dark:border-smak-neutral-700 focus-within:border-ai-indigo-400 dark:focus-within:border-ai-indigo-600 focus-within:shadow-md focus-within:shadow-ai-indigo-500/10'"
              >
                <textarea
                  id="chat-message-input"
                  ref="textareaRef"
                  v-model="messageInput"
                  placeholder="Запитайте про рецепт, інгредієнти або кулінарні поради..."
                  rows="1"
                  class="flex-1 min-w-0 resize-none bg-transparent text-sm sm:text-base text-smak-neutral-800 dark:text-smak-neutral-100 placeholder-smak-neutral-400 dark:placeholder-smak-neutral-500 focus:outline-none leading-normal py-0.5"
                  style="max-height: 150px; min-height: 24px;"
                  :disabled="!!(currentChat?.isArchived && chatId) || isStreaming || isAiLimitReached"
                  @keydown="handleKeydown"
                  @input="autoResize"
                />

                <div class="shrink-0 flex items-center gap-1.5">
                  <span class="hidden sm:block text-xs text-smak-neutral-300 dark:text-smak-neutral-600 font-bold">
                    ↵
                  </span>

                  <UButton
                    id="chat-send-btn"
                    size="sm"
                    variant="solid"
                    :color="canSend ? undefined : 'neutral'"
                    class="rounded-full font-bold h-[38px] w-[38px] p-0 flex items-center justify-center transition-all duration-200 cursor-pointer"
                    :class="canSend
                      ? 'bg-ai-indigo-500 hover:bg-ai-indigo-600 text-white shadow-md shadow-ai-indigo-500/25 hover:scale-105'
                      : ''"
                    :disabled="!canSend"
                    :loading="isStreaming"
                    aria-label="Надіслати повідомлення"
                    @click="handleSend"
                  >
                    <template #leading>
                      <UIcon name="i-lucide-send" class="w-4.5 h-4.5" />
                    </template>
                  </UButton>
                </div>
              </div>

              <!-- History / Search Chat Modal Toggle Button (Identical border to input) -->
              <button
                type="button"
                class="rounded-full shrink-0 h-[50px] w-[50px] flex items-center justify-center cursor-pointer hover:border-coral-400 hover:text-coral-500 transition-all bg-white dark:bg-smak-neutral-800/60 border border-smak-neutral-200 dark:border-smak-neutral-700 outline-none"
                aria-label="Історія чатів"
                @click="() => { isChatHistoryModalOpen = true }"
              >
                <UIcon name="i-lucide-history" class="w-5.5 h-5.5 text-coral-500" />
              </button>
            </div>

            <!-- Disclaimer Noticeable -->
            <p class="text-center text-xs font-semibold text-smak-neutral-400 dark:text-smak-neutral-500 mt-1.5">
              ШІ може помилятися. Перевіряйте важливу кулінарну інформацію.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat History / Search Modal -->
    <UModal
      v-model:open="isChatHistoryModalOpen"
      :ui="{
        content: 'sm:max-w-lg rounded-3xl border border-smak-neutral-200 dark:border-smak-neutral-800 bg-white dark:bg-smak-neutral-900 shadow-2xl p-5 sm:p-6 overflow-hidden'
      }"
    >
      <template #content>
        <div class="space-y-4 p-1">
          <!-- Search Input -->
          <div class="relative">
            <UInput
              v-model="chatSearchQuery"
              icon="i-lucide-search"
              placeholder="Пошук у чатах"
              size="md"
              class="w-full"
              :ui="{
                base: 'rounded-full bg-smak-neutral-100 dark:bg-smak-neutral-800/80 border-0 py-2.5 px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-coral-400'
              }"
              autofocus
            />
          </div>

          <!-- Section Label: Останні -->
          <div class="flex items-center justify-between pt-1">
            <span class="text-xs font-bold uppercase tracking-wider text-smak-neutral-400 dark:text-smak-neutral-500">
              Останні
            </span>
            <button
              type="button"
              class="rounded-full font-bold cursor-pointer bg-transparent hover:bg-transparent border border-transparent hover:border-coral-500 text-smak-neutral-700 dark:text-smak-neutral-300 hover:text-coral-500 transition-all px-3.5 py-1 text-sm flex items-center gap-1.5"
              @click="() => { isChatHistoryModalOpen = false; router.push('/chats') }"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4 text-coral-500" />
              <span>Новий чат</span>
            </button>
          </div>

          <!-- Chat List -->
          <div class="max-h-80 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            <div v-if="filteredChats.length === 0" class="py-8 text-center text-xs text-smak-neutral-400">
              Чати не знайдено
            </div>

            <div
              v-for="c in filteredChats"
              :key="c.id"
              class="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all duration-200 group border border-smak-neutral-200/50 dark:border-smak-neutral-800/50 hover:border-coral-400 dark:hover:border-coral-500 hover:shadow-xs bg-white dark:bg-smak-neutral-900/40"
              :class="[chatId === c.id ? 'bg-coral-50/50 dark:bg-coral-950/20 border-coral-300 dark:border-coral-800' : '']"
              @click="() => { isChatHistoryModalOpen = false; router.push(`/chats/${c.id}`) }"
            >
              <!-- Editing mode inside modal -->
              <template v-if="editingChatId === c.id">
                <div class="flex items-center gap-2 flex-1 pr-2" @click.stop>
                  <input
                    v-model="modalEditingTitle"
                    class="flex-1 text-sm font-semibold bg-transparent text-smak-neutral-800 dark:text-smak-neutral-100 border-b-2 border-coral-400 focus:outline-none py-0.5"
                    maxlength="255"
                    @keydown.enter="saveChatInModal(c)"
                    @keydown.esc="editingChatId = null"
                    autofocus
                  />
                  <button type="button" class="p-1 text-emerald-500 hover:text-emerald-600 cursor-pointer" @click="saveChatInModal(c)">
                    <UIcon name="i-lucide-check" class="w-4 h-4" />
                  </button>
                </div>
              </template>

              <!-- Normal display mode -->
              <template v-else>
                <div class="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <span class="text-sm font-semibold truncate text-smak-neutral-900 dark:text-smak-neutral-100 group-hover:text-coral-500 transition-colors">
                    {{ c.title || 'Новий чат' }}
                  </span>
                </div>

                <!-- Right-aligned Date & Action Buttons -->
                <div class="flex items-center justify-end gap-2 shrink-0 ml-auto text-right">
                  <span class="text-xs font-medium text-smak-neutral-400 dark:text-smak-neutral-500 shrink-0 text-right">
                    {{ formatChatDate(c.updatedAt || c.createdAt) }}
                  </span>

                  <!-- Action Buttons: Edit & Delete (Always visible) -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      class="p-1.5 rounded-xl text-smak-neutral-400 hover:text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-950/30 transition-all cursor-pointer"
                      title="Редагувати назву"
                      @click="startEditChatInModal(c, $event)"
                    >
                      <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 rounded-xl text-smak-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                      title="Видалити чат"
                      @click="openDeleteChatModal(c, $event)"
                    >
                      <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirm Modal using SharedConfirmModal component -->
    <SharedConfirmModal
      v-model:open="isDeletingConfirm"
      title="Видалити чат?"
      :description="`Всі повідомлення в чаті «${chatToDelete?.title || currentChat?.title || 'Новий чат'}» буде видалено.`"
      confirm-label="Видалити"
      cancel-label="Скасувати"
      confirm-color="rose"
      :on-confirm="confirmDeleteChat"
      :on-close="() => { chatToDelete = null }"
    />
  </div>
</template>

<style scoped>
</style>





