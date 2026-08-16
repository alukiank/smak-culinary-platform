import type { RecipeResponseDto } from '~/types/recipe'

// DTO: Brief recipe reference in chat message metadata
export interface ChatMessageRecipeRef {
  id: string
  title: string
  description?: string
  coverImageId?: string | null
  rating?: number
  cookTime?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
}

// DTO: Metadata attached to an AI message (e.g. recipe suggestions)
export interface ChatMessageMetadataDto {
  recipes?: ChatMessageRecipeRef[]
  isFeedback?: boolean
  isError?: boolean
  showDiets?: boolean
  showAllergies?: boolean
}

// DTO: A single chat message
export interface ChatMessageDto {
  id: string
  role: 'user' | 'model'
  content: string
  createdAt: string
  metadata?: ChatMessageMetadataDto | null
}

// DTO: A chat session
export interface ChatDto {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  summary: string | null
  messageCount: number
  isArchived: boolean
  recipeId?: string | null
}

// Cursor-based pagination meta
export interface ChatCursorMeta {
  nextCursor: string | null
  hasNextPage: boolean
  limit: number
  itemCount: number
}

// Paginated chat list response
export interface ChatListResponse {
  data: ChatDto[]
  meta: ChatCursorMeta
}

// Paginated messages response
export interface ChatMessagesResponse {
  data: ChatMessageDto[]
  meta: ChatCursorMeta
}

// Request DTOs
export interface CreateChatDto {
  title?: string
  recipeId?: string
}

export interface UpdateChatDto {
  title?: string
  isArchived?: boolean
  summary?: string
}

export interface SendMessageDto {
  text: string
}

// SSE event types from stream
export type SseEventType = 'text_chunk' | 'metadata' | 'done' | 'error'
