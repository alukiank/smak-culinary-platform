<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import type { RecipeResponseDto } from '~/types/recipe'
import type { ChatMessageDto, ChatMessageMetadataDto } from '~/types/chat'
import {
  buildReplacementQuery,
  buildTechniqueQuery,
  buildGeneralTipQuery,
  buildTimingQuery,
} from '~/utils/cook-prompts'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  recipe: RecipeResponseDto
  missingIngredients?: string[]
  currentStep?: number
  hideHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  missingIngredients: () => [],
  currentStep: 0,
  hideHeader: false,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

// ─── Local state (isolated from global useChat singleton) ─────────────────────

const { $api } = useNuxtApp()
const config = useRuntimeConfig()
const toast = useToast()
const { triggerUpgradeModal } = useBilling()
const { isAiLimitReached } = useChat()

const chatId = ref<string | null>(null)
const localMessages = ref<ChatMessageDto[]>([])
const isStreaming = ref(false)
const streamingContent = ref('')
const isSending = ref(false)
const inputText = ref('')
const messagesEndRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// Focus tracking for dynamic suggestions
const isInputFocused = ref(false)

const handleFocus = () => {
  isInputFocused.value = true
}

const handleBlur = () => {
  // Small timeout to allow clicks on quick actions to be registered
  setTimeout(() => {
    isInputFocused.value = false
  }, 200)
}

const showQuickActions = computed(() => {
  return localMessages.value.length === 0 || isInputFocused.value
})


// ─── Scroll to bottom ─────────────────────────────────────────────────────────

const scrollToBottom = async () => {
  await nextTick()
  messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
}

watch(localMessages, scrollToBottom)
watch(streamingContent, scrollToBottom)

// ─── Stream a message to the embedded chat ────────────────────────────────────

const streamToChat = async (text: string): Promise<void> => {
  if (!chatId.value || isStreaming.value) return

  // Optimistic user bubble (clean display)
  const userMsg: ChatMessageDto = {
    id: `temp-user-${Date.now()}`,
    role: 'user',
    content: text,
    createdAt: new Date().toISOString(),
    metadata: null,
  }
  localMessages.value = [...localMessages.value, userMsg]

  isStreaming.value = true
  streamingContent.value = ''
  let streamingMeta: ChatMessageMetadataDto | null = null

  const apiUrl = (config.public.apiUrl as string) || 'http://localhost:4000'

  // Build context payload if missing ingredients are present
  let payloadText = text
  if (props.missingIngredients && props.missingIngredients.length > 0) {
    if (!text.includes('[Контекст відсутніх інгредієнтів:')) {
      payloadText = `${text}\n\n[Контекст відсутніх інгредієнтів: Користувач НЕ відмітив наступні інгредієнти рецепту як наявні: ${props.missingIngredients.join(', ')}. Враховуй це при рекомендаціях та порадах заміни.]`
    }
  }

  return new Promise<void>((resolve, reject) => {
    const controller = new AbortController()

    fetchEventSource(`${apiUrl}/chats/${chatId.value}/messages/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text: payloadText }),
      signal: controller.signal,
      openWhenHidden: true,

      onopen: async (response) => {
        if (response.status === 403) {
          isAiLimitReached.value = true
          triggerUpgradeModal('chat')
          throw new Error('Daily AI request limit reached')
        }
        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`)
        }
      },

      onmessage: (event) => {
        const { event: eventType, data } = event

        if (eventType === 'text_chunk') {
          streamingContent.value += data
        } else if (eventType === 'stream_reset') {
          streamingContent.value = ''
          streamingMeta = null
        } else if (eventType === 'metadata') {
          try {
            const newMeta = JSON.parse(data) as ChatMessageMetadataDto
            streamingMeta = streamingMeta ? { ...streamingMeta, ...newMeta } : newMeta
          } catch {}
        } else if (eventType === 'done') {
          const aiMsg: ChatMessageDto = {
            id: `ai-${Date.now()}`,
            role: 'model',
            content: streamingContent.value,
            createdAt: new Date().toISOString(),
            metadata: streamingMeta,
          }
          localMessages.value = [...localMessages.value, aiMsg]
          isStreaming.value = false
          streamingContent.value = ''
          controller.abort()
          resolve()
        } else if (eventType === 'error') {
          isStreaming.value = false
          streamingContent.value = ''
          if (data && (data.includes('limit reached') || data.includes('Daily AI request limit') || data.includes('403'))) {
            isAiLimitReached.value = true
            triggerUpgradeModal('chat')
          } else {
            toast.add({ title: 'Помилка AI', description: data || 'Помилка відповіді', color: 'error' })
          }
          controller.abort()
          reject(new Error(data))
        }
      },

      onerror: (err: any) => {
        isStreaming.value = false
        streamingContent.value = ''

        const errorMsg = err?.message || String(err)
        if (errorMsg.includes('limit reached') || errorMsg.includes('Daily AI request limit') || errorMsg.includes('403')) {
          isAiLimitReached.value = true
          triggerUpgradeModal('chat')
          reject(err)
          throw err
        }

        toast.add({ title: "Помилка з'єднання", description: "Втрачено з'єднання з ШІ-асистентом", color: 'error' })
        reject(err)
        throw err
      },
    })
  })
}

// ─── Initialise chat session ──────────────────────────────────────────────────

const initChat = async () => {
  try {
    isSending.value = true

    // Check if there is an existing chat associated with this recipeId
    const response = await $api<{ data: { id: string; recipeId?: string | null }[] }>('/chats', {
      method: 'GET',
      query: { limit: 100 },
    })

    const existingChat = response.data.find(c => c.recipeId === props.recipe.id)

    if (existingChat) {
      chatId.value = existingChat.id
      // Load previous messages
      const msgResponse = await $api<{ data: ChatMessageDto[] }>(`/chats/${existingChat.id}/messages`, {
        method: 'GET',
        query: { limit: 100 },
      })
      localMessages.value = msgResponse.data
    } else {
      // Create new chat
      const chat = await $api<{ id: string }>('/chats', {
        method: 'POST',
        body: {
          title: `Готування: ${props.recipe.title}`,
          recipeId: props.recipe.id,
        },
      })
      chatId.value = chat.id
    }
  } catch (err) {
    toast.add({ title: 'Помилка', description: 'Не вдалося запустити ШІ-помічника', color: 'error' })
  } finally {
    isSending.value = false
  }
}

// ─── Send custom user message ─────────────────────────────────────────────────

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isStreaming.value || !chatId.value) return
  inputText.value = ''
  await streamToChat(text)
  await nextTick()
  inputRef.value?.focus()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ─── Quick action buttons ─────────────────────────────────────────────────────

const quickActions = computed(() => [
  {
    id: 'replacement',
    icon: 'i-lucide-replace',
    label: 'Чим замінити інгредієнти?',
    color: 'text-coral-500',
    build: () => buildReplacementQuery(props.recipe, props.currentStep, props.missingIngredients),
  },
  {
    id: 'technique',
    icon: 'i-lucide-flame',
    label: 'Поясни техніку приготування',
    color: 'text-orange-500',
    build: () => buildTechniqueQuery(props.recipe, props.currentStep),
  },
  {
    id: 'tip',
    icon: 'i-lucide-lightbulb',
    label: 'Порада по цьому кроку',
    color: 'text-amber-500',
    build: () => buildGeneralTipQuery(props.recipe, props.currentStep),
  },
  {
    id: 'timing',
    icon: 'i-lucide-timer',
    label: 'Час на вогні?',
    color: 'text-blue-500',
    build: () => buildTimingQuery(props.recipe, props.currentStep),
  },
])

const runQuickAction = async (build: () => string) => {
  if (isStreaming.value || !chatId.value) return
  await streamToChat(build())
}

// ─── The streaming "in-progress" AI bubble ───────────────────────────────────

const streamingMessage = computed<ChatMessageDto | null>(() => {
  if (!isStreaming.value) return null
  return {
    id: 'streaming',
    role: 'model',
    content: streamingContent.value,
    createdAt: new Date().toISOString(),
    metadata: null,
  }
})

// All messages in the chat session are visible since we don't send a hidden system prompt
const visibleMessages = computed(() => {
  return localMessages.value
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await initChat()
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden relative">

    <!-- Solid White Top Bar & Soft Gradient Fade Overlay -->
    <div class="absolute top-0 left-0 right-0 h-6 bg-white dark:bg-smak-neutral-900 z-20 pointer-events-none rounded-t-3xl"></div>
    <div class="absolute top-6 left-0 right-0 h-8 bg-linear-to-b from-white to-transparent dark:from-smak-neutral-900 dark:to-transparent z-20 pointer-events-none"></div>

    <!-- Quick actions removed from the top; now rendered dynamically above the input area -->

    <!-- ── Messages area ───────────────────────────────────────────────── -->
    <div class="flex-1 overflow-y-auto px-4 pt-9 pb-3 space-y-3.5 scrollbar-none flex flex-col chat-fade-mask">

      <!-- Initializing skeleton -->
      <div v-if="!chatId" class="flex flex-col items-center justify-center h-full gap-3 text-center py-6">
        <div class="w-10 h-10 rounded-2xl bg-ai-indigo-500/10 flex items-center justify-center">
          <UIcon name="i-lucide-chef-hat" class="w-5 h-5 text-ai-indigo-500 animate-pulse" />
        </div>
        <p class="text-[11px] font-bold text-smak-neutral-400 dark:text-smak-neutral-500 max-w-45 leading-relaxed">
          Підключаю ШІ-кухаря та надсилаю інформацію про рецепт...
        </p>
      </div>

      <!-- Messages list -->
      <template v-if="visibleMessages.length > 0">
        <ChatMessageBubble
          v-for="msg in visibleMessages"
          :key="msg.id"
          :message="msg"
        />
      </template>

      <!-- Streaming bubble -->
      <ChatMessageBubble
        v-if="streamingMessage"
        :message="streamingMessage"
        :is-streaming="true"
      />

      <!-- Empty state after init -->
      <div
        v-if="chatId && visibleMessages.length === 0 && !isStreaming && !streamingMessage"
        class="flex-1 flex flex-col items-center justify-center gap-4 text-center py-10 px-4"
      >
        <div class="w-14 h-14 rounded-2xl bg-coral-50/80 dark:bg-coral-950/30 border border-coral-200/60 dark:border-coral-900/40 flex items-center justify-center shadow-xs">
          <UIcon name="i-lucide-message-square-heart" class="w-7 h-7 text-coral-500" />
        </div>
        <p class="text-sm sm:text-base text-smak-neutral-600 dark:text-smak-neutral-300 font-semibold leading-relaxed max-w-70">
          Натисніть на одну з підказок нижче або задайте своє запитання
        </p>
      </div>

      <!-- Scroll anchor -->
      <div ref="messagesEndRef" />
    </div>

    <!-- ── Input area ──────────────────────────────────────────────────── -->
    <div class="px-4 sm:px-3.5 pb-6 sm:pb-3.5 pt-2 shrink-0 border-t border-smak-neutral-100/60 dark:border-smak-neutral-850 bg-white dark:bg-smak-neutral-950 flex flex-col transition-all duration-300">
      <!-- AI Limit Reached Warning Banner -->
      <div
        v-if="isAiLimitReached"
        class="flex items-center justify-between gap-2.5 mb-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-2xs animate-fade-in"
      >
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <UIcon name="i-lucide-zap-off" class="w-4 h-4" />
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-heading font-bold text-xs text-smak-neutral-900 dark:text-white truncate">
              Ліміт ШІ-запитів вичерпано
            </span>
            <span class="text-[10px] sm:text-xs text-smak-neutral-500 dark:text-smak-neutral-400 truncate">
              Оновіть тариф для продовження
            </span>
          </div>
        </div>
        <NuxtLink
          to="/billing/plans"
          class="shrink-0 px-3 py-1.5 rounded-xl bg-brand-gradient text-white font-bold text-xs shadow-xs hover:scale-105 transition-all cursor-pointer flex items-center gap-1"
        >
          <span>Тарифи</span>
          <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>

      <!-- Dynamic suggestions with premium slide-up transition -->
      <Transition name="slide-up">
        <div v-if="showQuickActions && !isAiLimitReached" class="pb-2.5">
          <div class="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            <button
              v-for="action in quickActions"
              :key="action.id"
              @click="runQuickAction(action.build)"
              :disabled="isStreaming || !chatId || isAiLimitReached"
              class="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 cursor-pointer focus:outline-none text-left w-full disabled:opacity-40 disabled:cursor-not-allowed shadow-xs hover:shadow-md hover:shadow-ai-indigo-500/5"
              :class="[
                'bg-white/80 dark:bg-smak-neutral-900/80 border-smak-neutral-200/60 dark:border-smak-neutral-800/80',
                'hover:border-ai-indigo-400 dark:hover:border-ai-indigo-500 hover:bg-ai-indigo-50/30 dark:hover:bg-ai-indigo-950/10',
                'disabled:hover:border-smak-neutral-200 dark:disabled:hover:border-smak-neutral-800 disabled:hover:bg-transparent',
              ]"
            >
              <UIcon :name="action.icon" class="w-4.5 h-4.5 shrink-0" :class="action.color" />
              <span class="text-smak-neutral-800 dark:text-smak-neutral-200 flex-1">{{ action.label }}</span>
              <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-smak-neutral-350 dark:text-smak-neutral-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
            </button>
          </div>
        </div>
      </Transition>

      <!-- Message Input Row (Exact 56px height h-14 with mr-18 right margin for FAB clearance gap) -->
      <div
        class="h-14 flex items-center gap-2 bg-smak-neutral-50/80 dark:bg-smak-neutral-900/80 border border-smak-neutral-200 dark:border-smak-neutral-800 rounded-full sm:rounded-2xl px-4 py-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-ai-indigo-500/20 focus-within:border-ai-indigo-500/50 shadow-xs mr-18 sm:mr-0"
        :class="{
          'border-ai-indigo-500/50': inputText.trim(),
          'opacity-60 pointer-events-none': isAiLimitReached
        }"
      >
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          placeholder="Своє запитання до ШІ..."
          class="flex-1 bg-transparent text-[15px] sm:text-base font-semibold text-smak-neutral-800 dark:text-white placeholder:text-sm sm:placeholder:text-[15px] placeholder:text-smak-neutral-400 dark:placeholder:text-smak-neutral-600 focus:outline-none"
          :disabled="isStreaming || !chatId || isAiLimitReached"
          @keydown="handleKeydown"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <button
          @click="sendMessage"
          :disabled="!inputText.trim() || isStreaming || !chatId || isAiLimitReached"
          class="sm:hidden w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed bg-ai-indigo-500 hover:bg-ai-indigo-600 text-white shadow-sm hover:shadow-md hover:shadow-ai-indigo-500/20"
        >
          <UIcon name="i-lucide-send-horizontal" class="w-4.5 h-4.5" />
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 280px; /* High enough to contain the suggestions */
  overflow: hidden;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
  max-height: 0px;
  padding-bottom: 0px !important;
  margin-top: 0px !important;
  margin-bottom: 0px !important;
}
.slide-up-enter-to,
.slide-up-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 280px;
}

/* Gradient fade-out mask for smooth top & bottom edges */
.chat-fade-mask {
  -webkit-mask-image: linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 12px), transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 12px), transparent 100%);
}

/* Custom scrollbar for quick actions if they overflow */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(120, 120, 120, 0.2);
  border-radius: 99px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
</style>

