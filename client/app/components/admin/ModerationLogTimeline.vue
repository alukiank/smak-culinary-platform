<script setup lang="ts">
import { computed } from 'vue'
import type { ModerationLog, ModerationDecision } from '~/types/moderation'
import { formatDate } from '~/utils/formatters'

const props = defineProps<{
  logs: ModerationLog[]
  loading?: boolean
}>()

const getDecisionLabel = (decision: ModerationDecision) => {
  switch (decision) {
    case 'approved': return 'Схвалено'
    case 'rejected': return 'Відхилено'
    case 'flagged': return 'Підозрілий контент (Flagged)'
    default: return decision
  }
}

const getDecisionColor = (decision: ModerationDecision) => {
  switch (decision) {
    case 'approved': return 'success'
    case 'rejected': return 'error'
    case 'flagged': return 'warning'
    default: return 'neutral'
  }
}

const getDecisionIcon = (decision: ModerationDecision) => {
  switch (decision) {
    case 'approved': return 'i-lucide-check-circle'
    case 'rejected': return 'i-lucide-x-circle'
    case 'flagged': return 'i-lucide-alert-triangle'
    default: return 'i-lucide-info'
  }
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const formattedDate = formatDate(dateString)
  const formattedTime = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  return `${formattedDate} о ${formattedTime}`
}

const formatConfidence = (score: number) => {
  if (score === undefined || score === null) return null
  return `${Math.round(score * 100)}%`
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="flex justify-center py-6">
      <span class="text-sm text-gray-500 flex items-center gap-2">
        <span class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
        Завантаження історії рішень...
      </span>
    </div>
    
    <div v-else-if="!logs || logs.length === 0" class="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
      <UIcon name="i-lucide-history" class="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Журнал модерації порожній</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Рішень щодо цього об'єкта ще не приймалося.</p>
    </div>

    <div v-else class="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 pl-6 space-y-6">
      <div 
        v-for="(log, idx) in logs" 
        :key="log.id" 
        class="relative animate-fade-in"
      >
        <!-- Timeline bullet icon -->
        <span 
          class="absolute left-[-35px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white dark:ring-gray-900"
          :class="[
            log.decision === 'approved' ? 'bg-emerald-500 text-white' : '',
            log.decision === 'rejected' ? 'bg-rose-500 text-white' : '',
            log.decision === 'flagged' ? 'bg-amber-500 text-white' : ''
          ]"
        >
          <UIcon :name="getDecisionIcon(log.decision)" class="w-3.5 h-3.5" />
        </span>

        <!-- Card for Log details -->
        <div class="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <!-- Author / Admin info -->
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-gray-900 dark:text-white">
                {{ log.admin ? log.admin.username : 'AI-Модератор' }}
              </span>
              <UBadge v-if="!log.admin" size="xs" color="ai-indigo" variant="subtle">AI</UBadge>
              <UBadge v-else size="xs" color="neutral" variant="outline">Адміністратор</UBadge>
            </div>

            <!-- Date -->
            <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {{ formatDateTime(log.createdAt) }}
            </span>
          </div>

          <!-- Decision and Confidence level -->
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <UBadge :color="getDecisionColor(log.decision)" size="sm">
              {{ getDecisionLabel(log.decision) }}
            </UBadge>
            
            <UBadge 
              v-if="log.aiConfidenceScore !== undefined && log.aiConfidenceScore !== null" 
              color="neutral" 
              variant="soft" 
              size="sm"
              icon="i-lucide-cpu"
            >
              Впевненість AI: {{ formatConfidence(log.aiConfidenceScore) }}
            </UBadge>
          </div>

          <!-- Reason block -->
          <div 
            v-if="log.reason" 
            class="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800/80 rounded-lg p-3 border border-gray-100/50 dark:border-gray-800 font-sans italic"
          >
            "{{ log.reason }}"
          </div>
          <div v-else class="text-xs text-gray-400 dark:text-gray-500 italic">
            Причину не вказано
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
