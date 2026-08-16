<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Message {
  id: number
  sender: 'user' | 'ai'
  text: string
  timestamp: string
}

const allMessages: { sender: 'user' | 'ai'; text: string }[] = [
  { sender: 'user', text: 'Привіт! Що смачного приготувати з курки та грибів?' },
  { sender: 'ai', text: 'Привіт! Маю чудову ідею — Карпатський крученик з лісовими грибами 🍄 або ніжну запечену курку. Що оберемо?' },
  { sender: 'user', text: 'Карпатський крученик звучить супер! Але в мене закінчилися вершки.' },
  { sender: 'ai', text: 'Без проблем! Я миттєво адаптую рецепт: замінимо вершки на фермерську сметану або кокосові вершки. Вже перерахувала інгредієнти!' }
]

const messages = ref<Message[]>([])
const isTyping = ref(false)
const typingSender = ref<'user' | 'ai'>('user')
let dialogueTimeout: any = null
let currentStep = 0

const startSimulation = async () => {
  messages.value = []
  currentStep = 0
  runNextStep()
}

const runNextStep = () => {
  if (currentStep >= allMessages.length) {
    // Simulation finished — stay at final state, don't loop
    return
  }

  const nextMsg = allMessages[currentStep]
  if (!nextMsg) return

  typingSender.value = nextMsg.sender
  isTyping.value = true

  // Typing simulation duration
  const typingDelay = nextMsg.sender === 'user' ? 1500 : 2500
  
  dialogueTimeout = setTimeout(() => {
    isTyping.value = false
    
    const currentMsg = allMessages[currentStep]
    if (currentMsg) {
      messages.value.push({
        id: Date.now(),
        sender: currentMsg.sender,
        text: currentMsg.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })
    }
    
    currentStep++
    
    // Delay before next person starts typing
    dialogueTimeout = setTimeout(() => {
      runNextStep()
    }, 1800)
  }, typingDelay)
}

onMounted(() => {
  startSimulation()
})

onUnmounted(() => {
  if (dialogueTimeout) clearTimeout(dialogueTimeout)
})
</script>

<template>
  <div class="w-full max-w-lg mx-auto bg-white/70 dark:bg-smak-neutral-900/75 backdrop-blur-xl border border-smak-neutral-100 dark:border-smak-neutral-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[400px] lg:h-full transition-smooth hover:shadow-2xl hover:border-ai-indigo-300/40 dark:hover:border-ai-indigo-700/30">
    
    <!-- Header of the chat window -->
    <div class="px-5 py-4 border-b border-smak-neutral-100 dark:border-smak-neutral-800 flex items-center justify-between bg-white/30 dark:bg-smak-neutral-900/30">
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-10 h-10 rounded-2xl bg-linear-to-br from-ai-indigo-500 to-ai-indigo-600 flex items-center justify-center text-white shadow-md shadow-ai-indigo-500/25">
            <UIcon name="i-lucide-sparkles" class="w-5 h-5 animate-pulse" />
          </div>
          <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-smak-neutral-900 rounded-full"></span>
        </div>
        <div>
          <h4 class="text-sm font-bold font-heading text-smak-neutral-900 dark:text-white flex items-center gap-1.5">
            ШІ-помічник SMAK
            <span class="text-[10px] bg-ai-indigo-100 dark:bg-ai-indigo-950 text-ai-indigo-600 dark:text-ai-indigo-400 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">AI</span>
          </h4>
          <p class="text-[11px] text-smak-neutral-400 dark:text-smak-neutral-500 font-medium">Онлайн • Готовий допомогти</p>
        </div>
      </div>
      
      <div class="flex items-center gap-1">
        <span class="w-2.5 h-2.5 rounded-full bg-smak-neutral-200 dark:bg-smak-neutral-800"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-smak-neutral-200 dark:bg-smak-neutral-800"></span>
      </div>
    </div>

    <!-- Message area -->
    <div class="flex-1 p-5 overflow-y-auto space-y-4 flex flex-col justify-end min-h-0 bg-linear-to-b from-transparent to-smak-neutral-50/20 dark:to-smak-neutral-950/10">
      
      <!-- Welcome message -->
      <div class="text-center py-2" v-if="messages.length === 0 && !isTyping">
        <p class="text-xs text-smak-neutral-400 dark:text-smak-neutral-500 font-medium">ШІ-помічник аналізує ваші кулінарні запити...</p>
      </div>

      <!-- Messages list -->
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex flex-col max-w-[85%] transition-smooth animate-fade-in"
        :class="[msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start']"
      >
        <div 
          class="px-4.5 py-3 rounded-2xl text-sm shadow-xs leading-relaxed"
          :class="[
            msg.sender === 'user'
              ? 'bg-coral-500 text-white rounded-br-none shadow-md shadow-coral-500/10'
              : 'bg-white dark:bg-smak-neutral-800 text-smak-neutral-800 dark:text-smak-neutral-100 border border-smak-neutral-100 dark:border-smak-neutral-700/50 rounded-bl-none'
          ]"
        >
          {{ msg.text }}
        </div>
        <span class="text-[10px] text-smak-neutral-400 dark:text-smak-neutral-500 mt-1 px-1 font-semibold">
          {{ msg.timestamp }}
        </span>
      </div>

      <!-- Typing Indicator -->
      <div
        v-if="isTyping"
        class="flex flex-col max-w-[85%] transition-smooth"
        :class="[typingSender === 'user' ? 'self-end items-end' : 'self-start items-start']"
      >
        <div
          class="px-4 py-3 rounded-2xl bg-white dark:bg-smak-neutral-800 text-smak-neutral-800 dark:text-smak-neutral-100 border border-smak-neutral-100 dark:border-smak-neutral-700/50 flex items-center gap-1.5 shadow-xs"
          :class="[typingSender === 'user' ? 'rounded-br-none bg-coral-50 dark:bg-coral-950/20 border-coral-200 dark:border-coral-900/20' : 'rounded-bl-none']"
        >
          <span class="w-2 h-2 bg-smak-neutral-400 dark:bg-smak-neutral-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 bg-smak-neutral-400 dark:bg-smak-neutral-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-2 h-2 bg-smak-neutral-400 dark:bg-smak-neutral-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
