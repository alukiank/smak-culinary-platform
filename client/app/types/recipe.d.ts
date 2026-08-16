import type { UserPublicDto, UserPrivateDto } from './user'

export type RecipeCategory =
  | "Breakfast & Brunch"
  | "Appetizers & Starters"
  | "Soups & Stews"
  | "Salads"
  | "Poultry"
  | "Meat"
  | "Seafood"
  | "Side Dishes"
  | "Snacks"
  | "Breads & Bakery"
  | "Desserts"
  | "Beverages"
  | "Sauces & Dressings"
  | "Drinks"

export type CuisineType =
  | "african"
  | "american"
  | "asian"
  | "british"
  | "caribbean"
  | "chinese"
  | "european"
  | "filipino"
  | "french"
  | "german"
  | "greek"
  | "indian"
  | "italian"
  | "japanese"
  | "korean"
  | "latin american"
  | "mediterranean"
  | "mexican"
  | "middle eastern"
  | "middle eastern region"
  | "russian"
  | "spanish"
  | "thai"
  | "turkish"
  | "vietnamese"
  | "other"

export type TasteType =
  | "bitter"
  | "neutral"
  | "savory"
  | "sour"
  | "spicy"
  | "sweet"
  | "umami"

export type RecipeDifficulty = "easy" | "medium" | "hard"
export type CookSpeed = "fast" | "medium" | "slow"
export type RecipeStatus = "public" | "draft" | "archived" | "rejected" | "premoderation" | "moderation"

export interface CreateRecipeDto {
  title: string
  category: RecipeCategory
  description: string
  ingredients: string[]
  directions: string[]
  cookSpeed: CookSpeed
  prepTime: number
  cookTime: number
  difficulty: RecipeDifficulty
  cuisineList?: CuisineType[]
  tastes?: TasteType[]
  ingredientsSearch: string[]
  isVegan?: boolean
  isVegetarian?: boolean
  isGluten_free?: boolean
  isHalal?: boolean
  isKosher?: boolean
  isDairyFree?: boolean
  isNutFree?: boolean
  healthScore?: number
  status?: "draft" | "premoderation"
  coverImageId?: string | null
  galleryImageIds?: string[]
  youtubeVideoUrl?: string
}

export interface RecipeResponseDto {
  id: string
  title: string
  category: RecipeCategory
  description: string
  ingredients: string[]
  directions: string[]
  cookSpeed: CookSpeed
  prepTime: number
  cookTime: number
  difficulty: RecipeDifficulty
  cuisineList: CuisineType[]
  tastes: TasteType[]
  isVegan: boolean
  isVegetarian: boolean
  isGluten_free: boolean
  isHalal: boolean
  isKosher: boolean
  isDairyFree: boolean
  isNutFree: boolean
  healthScore: number
  createdAt: string
  updatedAt: string
  status: RecipeStatus
  rating: number
  numRatings: number
  coverImageId: string
  galleryImageIds: string[]
  youtubeVideoUrl: string
  user: UserPublicDto
}

export interface RecipeSearchQuery {
  page?: number
  limit?: number
  query?: string
  category?: RecipeCategory
  cuisineList?: string
  isVegetarian?: boolean
  isVegan?: boolean
  isGluten_free?: boolean
  isHalal?: boolean
  isKosher?: boolean
  isDairyFree?: boolean
  isNutFree?: boolean
  difficulty?: RecipeDifficulty
  cookSpeed?: CookSpeed
  maxCookTime?: number
  minHealthScore?: number
  maxHealthScore?: number
  minRating?: number
  maxRating?: number
  status?: RecipeStatus
  userId?: string
}

export interface RecipeSearchResponse {
  data: RecipeResponseDto[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export interface RecipeReviewResponseDto {
  id: string
  rating: number
  text: string
  imageId: string | null
  commentsCount: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  user: UserPublicDto
  recipe?: RecipeResponseDto
}

export interface CreateRecipeReviewDto {
  rating: number
  text?: string
  imageId?: string | null
}

export interface UpdateRecipeReviewDto {
  rating?: number
  text?: string
  imageId?: string | null
}

export interface RecipeReviewCommentDto {
  id: string
  text: string
  createdAt: string
  updatedAt: string
  user: UserPublicDto
}

export interface CreateRecipeReviewCommentDto {
  text: string
}

export interface RecipeReviewsPaginatedResponse {
  data: RecipeReviewResponseDto[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export interface RecipeCommentsPaginatedResponse {
  data: RecipeReviewCommentDto[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export interface RecipeAdminResponseDto extends Omit<RecipeResponseDto, 'user'> {
  user: UserPrivateDto
}

export interface RecipeAdminSearchResponse {
  data: RecipeAdminResponseDto[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export interface UpdateRecipeStatusDto {
  status: RecipeStatus
}
