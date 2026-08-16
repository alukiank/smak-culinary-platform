export type ModerationDecision = 'approved' | 'rejected' | 'flagged'

export interface ModerationLog {
  id: string
  decision: ModerationDecision
  reason: string | null
  aiConfidenceScore: number
  createdAt: string
  admin: {
    id: string
    username: string
    email?: string
  } | null
}

export interface ModerateRecipeDto {
  decision: ModerationDecision
  reason?: string
}

export interface ModerateRecipeReviewDto {
  decision: ModerationDecision
  reason?: string
}
