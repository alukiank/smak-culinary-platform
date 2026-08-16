<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { RecipeResponseDto } from '~/types/recipe'

const props = defineProps<{
  recipe: RecipeResponseDto
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const checkedIngredients = defineModel<Record<string, boolean>>('checkedIngredients', { default: () => ({}) })

const emit = defineEmits<{
  (e: 'completed'): void
}>()

const toast = useToast()

const currentCookStep = ref(0)
const activeTab = ref<'wizard' | 'ingredients' | 'steps'>('ingredients')

const checkedIngredientsCount = computed(() => {
  return Object.values(checkedIngredients.value).filter(Boolean).length
})

const stepTimerSeconds = ref(0)
const stepTimerRunning = ref(false)
const timerIntervalId = ref<any>(null)

// Step timer minutes parser
const stepTimerMinutes = computed(() => {
  if (!props.recipe) return 0
  const stepText = props.recipe.directions[currentCookStep.value] || ''
  const minMatch = stepText.match(/(\d+)\s*хв/i)
  const minuteMatch = stepText.match(/(\d+)\s*хвилин/i)
  
  if (minMatch && minMatch[1]) return parseInt(minMatch[1])
  if (minuteMatch && minuteMatch[1]) return parseInt(minuteMatch[1])
  return 0
})

const formatTimerValue = (totalSec: number) => {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

const startStepTimer = () => {
  if (timerIntervalId.value) clearInterval(timerIntervalId.value)
  stepTimerSeconds.value = stepTimerMinutes.value * 60
  stepTimerRunning.value = true
  
  timerIntervalId.value = setInterval(() => {
    if (stepTimerSeconds.value > 0) {
      stepTimerSeconds.value--
    } else {
      pauseStepTimer()
      // Alarm beep sound via Web Audio API
      if (import.meta.client) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          osc.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          osc.type = 'sine'
          osc.frequency.value = 880 // A5 note
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
          osc.start()
          osc.stop(audioCtx.currentTime + 0.6)
        } catch (timerErr) {
          console.log('Timer alarm beep blocked:', timerErr)
        }
      }
      toast.add({
        title: 'Час вийшов!',
        description: `Таймер для кроку ${currentCookStep.value + 1} завершено.`,
        color: 'primary'
      })
    }
  }, 1000)
}

const pauseStepTimer = () => {
  stepTimerRunning.value = false
  if (timerIntervalId.value) {
    clearInterval(timerIntervalId.value)
    timerIntervalId.value = null
  }
}

const resumeStepTimer = () => {
  stepTimerRunning.value = true
  timerIntervalId.value = setInterval(() => {
    if (stepTimerSeconds.value > 0) {
      stepTimerSeconds.value--
    } else {
      pauseStepTimer()
    }
  }, 1000)
}

const closeCookMode = () => {
  isOpen.value = false
  pauseStepTimer()
}

const prevCookStep = () => {
  if (currentCookStep.value > 0) {
    currentCookStep.value--
    pauseStepTimer()
    stepTimerSeconds.value = 0
  }
}

const nextCookStep = () => {
  if (props.recipe && currentCookStep.value < props.recipe.directions.length - 1) {
    currentCookStep.value++
    pauseStepTimer()
    stepTimerSeconds.value = 0
  }
}

const askChefAboutStep = (questionType: string) => {
  if (!props.recipe) return
  const stepText = props.recipe.directions[currentCookStep.value]
  let queryPrompt = ''
  
  if (questionType === 'replacement') {
    queryPrompt = `Я готую твій рецепт "${props.recipe.title}" і на кроці "${stepText}" виникли питання щодо інгредієнтів. Чим можна замінити інгредієнти у цьому кроці?`
  } else if (questionType === 'technique') {
    queryPrompt = `Я на кроці "${stepText}" у рецепті "${props.recipe.title}". Поясни, будь ласка, детальніше техніку приготування або що саме потрібно зробити.`
  } else {
    queryPrompt = `Я готую за рецептом "${props.recipe.title}" на кроці "${stepText}". Підкажи пораду щодо цього етапу.`
  }
  
  navigateTo({
    path: '/chats',
    query: { prompt: queryPrompt }
  })
}

const toggleIngredient = (ing: string) => {
  checkedIngredients.value[ing] = !checkedIngredients.value[ing]
}

// Watch for recipe changes to reset cook states
watch(() => props.recipe.id, () => {
  currentCookStep.value = 0
  pauseStepTimer()
  stepTimerSeconds.value = 0
})

onBeforeUnmount(() => {
  pauseStepTimer()
})
</script>

<template>
  <UModal 
    v-model:open="isOpen"
    fullscreen
  >
    <template #content>
      <div v-if="recipe" class="flex flex-col h-screen select-none bg-white dark:bg-smak-neutral-950 text-left">
        
        <!-- Cook Mode Header bar -->
        <header class="h-16 border-b border-smak-neutral-100 dark:border-smak-neutral-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-smak-neutral-950/80 backdrop-blur-md">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-coral-500/10 flex items-center justify-center text-coral-500 shrink-0">
              <UIcon name="i-lucide-cooking-pot" class="w-4.5 h-4.5" />
            </div>
            <div class="hidden sm:block">
              <p class="text-[10px] text-smak-neutral-400 uppercase tracking-wider font-extrabold">Режим готування</p>
              <h4 class="text-xs sm:text-sm text-smak-neutral-800 dark:text-white font-bold max-w-[120px] sm:max-w-xs truncate">
                {{ recipe.title }}
              </h4>
            </div>
          </div>

          <!-- Pill Tab Switcher -->
          <div class="flex items-center bg-smak-neutral-50 dark:bg-smak-neutral-900 p-1 rounded-2xl border border-smak-neutral-100/50 dark:border-white/5 select-none shrink-0 mx-2">
            <button
              v-for="tab in [
                { id: 'ingredients', label: 'Інгредієнти', icon: 'i-lucide-shopping-basket' },
                { id: 'wizard', label: 'Покроково', icon: 'i-lucide-play-circle' },
                { id: 'steps', label: 'План кроків', icon: 'i-lucide-list-ordered' }
              ]"
              :key="tab.id"
              @click="activeTab = tab.id as any"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer border-none focus:outline-none"
              :class="[
                activeTab === tab.id
                  ? 'bg-coral-500 text-white shadow-xs'
                  : 'text-smak-neutral-500 dark:text-smak-neutral-400 hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 hover:text-smak-neutral-800 dark:hover:text-white bg-transparent'
              ]"
            >
              <UIcon :name="tab.icon" class="w-4 h-4 shrink-0" />
              <span class="hidden md:inline">{{ tab.label }}</span>
            </button>
          </div>
          
          <button 
            @click="closeCookMode"
            class="p-2 rounded-full hover:bg-smak-neutral-100 dark:hover:bg-smak-neutral-800 text-smak-neutral-500 hover:text-smak-neutral-800 dark:hover:text-white transition-smooth focus:outline-none cursor-pointer"
            title="Закрити режим"
          >
            <UIcon name="i-lucide-x" class="w-6 h-6" />
          </button>
        </header>

        <!-- Main Content Area split depending on the active tab -->
        <div class="flex-1 overflow-hidden flex flex-col">
          
          <!-- TAB 1: FULL INGREDIENTS CHECKLIST -->
          <div v-if="activeTab === 'ingredients'" class="flex-1 overflow-y-auto p-6 sm:p-10 max-w-4xl mx-auto w-full">
            <div class="space-y-6">
              <div class="text-center md:text-left">
                <h2 class="text-xl sm:text-2xl font-black text-smak-neutral-900 dark:text-white font-heading">
                  Підготовка інгредієнтів
                </h2>
                <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 mt-1 leading-relaxed font-semibold">
                  Позначте підготовлені інгредієнти, щоб нічого не забути в процесі приготування.
                </p>
              </div>

              <!-- Progress Bar -->
              <div class="bg-smak-neutral-50 dark:bg-smak-neutral-900/60 p-4 rounded-2xl border border-smak-neutral-100/50 dark:border-white/5">
                <div class="flex items-center justify-between text-xs font-bold text-smak-neutral-700 dark:text-smak-neutral-300 mb-2">
                  <span>Підготовлено інгредієнтів</span>
                  <span>{{ checkedIngredientsCount }} з {{ recipe.ingredients.length }}</span>
                </div>
                <div class="w-full bg-smak-neutral-100 dark:bg-smak-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    class="bg-brand-gradient h-full transition-all duration-500"
                    :style="{ width: `${(checkedIngredientsCount / recipe.ingredients.length) * 100}%` }"
                  ></div>
                </div>
              </div>

              <!-- Grid of checkable cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  v-for="ing in recipe.ingredients" 
                  :key="ing"
                  @click="toggleIngredient(ing)"
                  class="flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none bg-white dark:bg-smak-neutral-900 hover:scale-[1.01]"
                  :class="[
                    checkedIngredients[ing]
                      ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/5 shadow-inner'
                      : 'border-smak-neutral-100/50 dark:border-white/5 hover:border-coral-200 dark:hover:border-coral-900/30 shadow-xs'
                  ]"
                >
                  <div class="flex items-center gap-3 overflow-hidden">
                    <UIcon 
                      :name="checkedIngredients[ing] ? 'i-lucide-check-circle-2' : 'i-lucide-circle'" 
                      class="w-5 h-5 shrink-0 transition-colors"
                      :class="[checkedIngredients[ing] ? 'text-emerald-500' : 'text-smak-neutral-300 dark:text-smak-neutral-700']"
                    />
                    <span 
                      class="text-sm font-semibold truncate text-left"
                      :class="[checkedIngredients[ing] ? 'line-through text-smak-neutral-400 dark:text-smak-neutral-600' : 'text-smak-neutral-800 dark:text-smak-neutral-200']"
                    >
                      {{ ing }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Start Cooking Button to switch to wizard tab -->
              <div class="flex justify-center pt-4 select-none">
                <UButton 
                  color="primary" 
                  size="md" 
                  class="rounded-2xl font-black px-8 py-3.5 tracking-widest uppercase text-xs"
                  @click="() => { activeTab = 'wizard' }"
                >
                  <span>Розпочати покрокове готування</span>
                  <UIcon name="i-lucide-arrow-right" class="w-4 h-4 ml-1.5" />
                </UButton>
              </div>
            </div>
          </div>

          <!-- TAB 2: ACTIVE WIZARD STEP-BY-STEP (Left + Right side assistant panel) -->
          <div v-if="activeTab === 'wizard'" class="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            <!-- Large Steps view (Left portion) -->
            <div class="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-center items-center text-center space-y-6">
              
              <div class="space-y-2">
                <span class="px-4 py-1.5 bg-coral-50 dark:bg-coral-950/30 text-coral-600 dark:text-coral-400 rounded-full text-xs font-display font-black uppercase tracking-widest shadow-xs">
                  Крок {{ currentCookStep + 1 }} із {{ recipe.directions.length }}
                </span>
              </div>

              <!-- Big readable Instruction Text (Wow typography!) -->
              <p class="text-xl sm:text-2xl md:text-3xl text-smak-neutral-900 dark:text-white font-semibold font-heading leading-relaxed max-w-3xl py-4 select-text">
                {{ recipe.directions[currentCookStep] }}
              </p>

              <!-- Dynamic step countdown timer widget -->
              <div v-if="stepTimerMinutes > 0" class="bg-coral-50/30 dark:bg-coral-950/10 border border-coral-100/50 dark:border-coral-900/20 p-6 rounded-3xl max-w-md w-full flex flex-col items-center gap-4 transition-smooth">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-timer" class="w-5 h-5 text-coral-500" />
                  <span class="text-xs font-bold text-smak-neutral-500 dark:text-smak-neutral-400 uppercase tracking-wider">
                    Знайдено таймер: {{ stepTimerMinutes }} хв
                  </span>
                </div>

                <!-- Time Counter Display -->
                <div class="font-display font-black text-4xl sm:text-5xl text-smak-neutral-900 dark:text-white tracking-widest">
                  {{ formatTimerValue(stepTimerSeconds > 0 ? stepTimerSeconds : stepTimerMinutes * 60) }}
                </div>

                <!-- Timer Controls -->
                <div class="flex items-center gap-3">
                  <UButton 
                    v-if="stepTimerSeconds === 0"
                    color="primary"
                    class="rounded-xl font-bold px-4 py-2"
                    @click="startStepTimer"
                  >
                    Запустити
                  </UButton>

                  <template v-else>
                    <UButton 
                      v-if="stepTimerRunning"
                      color="neutral"
                      variant="subtle"
                      class="rounded-xl font-bold px-4 py-2"
                      @click="pauseStepTimer"
                    >
                      Пауза
                    </UButton>
                    <UButton 
                      v-else
                      color="primary"
                      class="rounded-xl font-bold px-4 py-2"
                      @click="resumeStepTimer"
                    >
                      Продовжити
                    </UButton>
                    
                    <button 
                      type="button"
                      class="rounded-xl font-bold px-4 py-2 bg-transparent hover:bg-transparent text-smak-neutral-700 dark:text-smak-neutral-300 border border-transparent hover:border-coral-500 hover:text-coral-500 transition-all cursor-pointer text-sm"
                      @click="() => { stepTimerSeconds = 0; pauseStepTimer() }"
                    >
                      Скинути
                    </button>
                  </template>
                </div>
              </div>

            </div>

            <!-- AI Assistant Kitchen side-helper suggest panel (Right portion) -->
            <div class="w-full md:w-80 border-t md:border-t-0 md:border-l border-smak-neutral-100 dark:border-smak-neutral-800/80 bg-smak-neutral-50 dark:bg-smak-neutral-900/60 p-6 flex flex-col justify-between shrink-0 text-left">
              
              <div class="space-y-5">
                <h4 class="font-heading font-bold text-base text-smak-neutral-800 dark:text-white flex items-center gap-2">
                  <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-coral-500" />
                  <span>ШІ-Помічник на кухні</span>
                </h4>
                <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 leading-relaxed font-semibold">
                  Маєте запитання чи виникли труднощі на цьому кроці приготування? Запитайте у вашого персонального ШІ-кухаря SMAK:
                </p>

                <!-- Quick action assistance suggesters -->
                <div class="space-y-3 pt-1 select-none">
                  <button 
                    @click="askChefAboutStep('replacement')"
                    class="w-full p-3 bg-white dark:bg-smak-neutral-800 hover:border-coral-300 dark:hover:border-coral-900 border border-smak-neutral-100 dark:border-smak-neutral-700/50 rounded-2xl text-left transition-smooth focus:outline-none cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <UIcon name="i-lucide-replace" class="w-4.5 h-4.5 text-coral-500" />
                      <span class="text-xs font-bold text-smak-neutral-850 dark:text-white">Чим замінити інгредієнти?</span>
                    </div>
                  </button>

                  <button 
                    @click="askChefAboutStep('technique')"
                    class="w-full p-3 bg-white dark:bg-smak-neutral-800 hover:border-coral-300 dark:hover:border-coral-900 border border-smak-neutral-100 dark:border-smak-neutral-700/50 rounded-2xl text-left transition-smooth focus:outline-none cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <UIcon name="i-lucide-flame" class="w-4.5 h-4.5 text-coral-500" />
                      <span class="text-xs font-bold text-smak-neutral-850 dark:text-white">Поясни техніку приготування</span>
                    </div>
                  </button>

                  <button 
                    @click="askChefAboutStep('general')"
                    class="w-full p-3 bg-white dark:bg-smak-neutral-800 hover:border-coral-300 dark:hover:border-coral-900 border border-smak-neutral-100 dark:border-smak-neutral-700/50 rounded-2xl text-left transition-smooth focus:outline-none cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <UIcon name="i-lucide-help-circle" class="w-4.5 h-4.5 text-coral-500" />
                      <span class="text-xs font-bold text-smak-neutral-850 dark:text-white">Запитати пораду по кроку</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Mini Ingredients checklist inside cook mode -->
              <div class="hidden md:block border-t border-smak-neutral-100 dark:border-smak-neutral-800/80 pt-4 mt-4 overflow-y-auto max-h-48 scrollbar-none">
                <h5 class="text-xs font-bold text-smak-neutral-400 uppercase tracking-wider mb-2">Інгредієнти:</h5>
                <div class="space-y-1.5">
                  <div 
                    v-for="ing in recipe.ingredients" 
                    :key="ing"
                    class="flex items-center gap-2 text-xs font-semibold"
                    :class="[checkedIngredients[ing] ? 'line-through text-smak-neutral-400 dark:text-smak-neutral-600' : 'text-smak-neutral-800 dark:text-smak-neutral-200']"
                  >
                    <button @click="toggleIngredient(ing)" class="focus:outline-none cursor-pointer">
                      <UIcon :name="checkedIngredients[ing] ? 'i-lucide-check-square' : 'i-lucide-square'" class="w-4 h-4 shrink-0 mt-0.5 text-coral-500" />
                    </button>
                    <span class="truncate text-left" :title="ing">{{ ing }}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <!-- TAB 3: FULL CHRONOLOGICAL STEPS PLAN TIMELINE -->
          <div v-if="activeTab === 'steps'" class="flex-1 overflow-y-auto p-6 sm:p-10 max-w-4xl mx-auto w-full">
            <div class="space-y-6">
              <div class="text-center md:text-left">
                <h2 class="text-xl sm:text-2xl font-black text-smak-neutral-900 dark:text-white font-heading">
                  План приготування
                </h2>
                <p class="text-xs text-smak-neutral-500 dark:text-smak-neutral-400 mt-1 leading-relaxed font-semibold">
                  Повний список кроків рецепту. Натисніть на будь-який крок, щоб перейти безпосередньо до нього в інтерактивному помічнику.
                </p>
              </div>

              <!-- Vertical Timeline of Step Cards -->
              <div class="relative pl-6 sm:pl-8 border-l-2 border-smak-neutral-100 dark:border-white/5 space-y-6 ml-3 sm:ml-4 text-left">
                <div 
                  v-for="(step, sIdx) in recipe.directions" 
                  :key="sIdx"
                  @click="currentCookStep = sIdx; activeTab = 'wizard'; pauseStepTimer(); stepTimerSeconds = 0;"
                  class="relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer bg-white dark:bg-smak-neutral-900 hover:scale-[1.01]"
                  :class="[
                    currentCookStep === sIdx
                      ? 'border-coral-500 shadow-sm shadow-coral-500/5 ring-1 ring-coral-500/20'
                      : 'border-smak-neutral-100/50 dark:border-white/5 hover:border-coral-200 dark:hover:border-coral-900/30'
                  ]"
                >
                  <!-- Outer Node marker on the line -->
                  <div 
                    class="absolute left-[-35px] sm:left-[-43px] top-6 w-5 h-5 rounded-full border-2 bg-white dark:bg-smak-neutral-950 flex items-center justify-center transition-all duration-300"
                    :class="[
                      currentCookStep === sIdx 
                        ? 'border-coral-500 scale-125 ring-4 ring-coral-500/10' 
                        : sIdx < currentCookStep 
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' 
                          : 'border-smak-neutral-200 dark:border-smak-neutral-800'
                    ]"
                  >
                    <UIcon 
                      v-if="sIdx < currentCookStep" 
                      name="i-lucide-check" 
                      class="w-3 h-3 text-emerald-500 font-extrabold" 
                    />
                    <span v-else class="w-1.5 h-1.5 rounded-full bg-smak-neutral-400 dark:bg-smak-neutral-600" :class="[currentCookStep === sIdx ? 'bg-coral-500' : '']"></span>
                  </div>

                  <div class="flex items-center justify-between gap-3 mb-2">
                    <span 
                      class="text-xs font-display font-black uppercase tracking-wider"
                      :class="[currentCookStep === sIdx ? 'text-coral-500' : 'text-smak-neutral-400 dark:text-smak-neutral-500']"
                    >
                      Крок {{ sIdx + 1 }}
                    </span>
                    
                    <span 
                      v-if="currentCookStep === sIdx"
                      class="px-2.5 py-0.5 rounded-full bg-coral-500/10 text-coral-500 dark:text-coral-400 text-[10px] font-black uppercase tracking-wider"
                    >
                      Поточний
                    </span>
                    <span 
                      v-else-if="sIdx < currentCookStep"
                      class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider"
                    >
                      Виконано
                    </span>
                  </div>

                  <p 
                    class="text-sm font-semibold leading-relaxed"
                    :class="[
                      currentCookStep === sIdx 
                        ? 'text-smak-neutral-900 dark:text-white' 
                        : 'text-smak-neutral-500 dark:text-smak-neutral-400'
                    ]"
                  >
                    {{ step }}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Cook Mode Footer Navigation controller (Only on Wizard Tab) -->
        <footer v-if="activeTab === 'wizard'" class="h-18 border-t border-smak-neutral-100 dark:border-smak-neutral-800/80 px-6 sm:px-10 flex items-center justify-between shrink-0 bg-white dark:bg-smak-neutral-950 select-none">
          
          <UButton 
            variant="outline" 
            color="neutral" 
            size="md" 
            class="rounded-xl font-bold px-5"
            @click="prevCookStep"
            :disabled="currentCookStep === 0"
          >
            Назад
          </UButton>

          <!-- Current step index circle dots -->
          <div class="hidden sm:flex items-center gap-1.5">
            <span 
              v-for="(dir, idx) in recipe.directions" 
              :key="idx"
              class="w-2.5 h-2.5 rounded-full transition-all duration-300"
              :class="[currentCookStep === idx ? 'bg-coral-500 w-5' : 'bg-smak-neutral-200 dark:bg-smak-neutral-800']"
            ></span>
          </div>

          <UButton 
            v-if="currentCookStep < recipe.directions.length - 1"
            color="primary" 
            size="md" 
            class="rounded-xl font-bold px-5"
            @click="nextCookStep"
          >
            Наступний крок
          </UButton>
          
          <UButton 
            v-else
            color="success" 
            size="md" 
            class="rounded-xl font-bold px-5 flex items-center gap-1.5"
            @click="closeCookMode(); emit('completed')"
          >
            <UIcon name="i-lucide-party-popper" class="w-4.5 h-4.5" />
            <span>Завершити</span>
          </UButton>

        </footer>

      </div>
    </template>
  </UModal>
</template>
