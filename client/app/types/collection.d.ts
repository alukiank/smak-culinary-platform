import type { RecipeResponseDto } from './recipe'

export interface RecipeCollectionResponseDto {
  id: string
  name: string
  description?: string
  isSystem: boolean
  recipesCount: number
  createdAt: string
  updatedAt: string
  recipes?: RecipeResponseDto[]
}

export interface CreateCollectionDto {
  name: string
  description?: string
}

export interface UpdateCollectionDto {
  name?: string
  description?: string
}
