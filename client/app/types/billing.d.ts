export type PlanType = 'FREE' | 'PRO' | 'PREMIUM'

export type Currency = 'UAH'

export interface PlanFeatures {
  maxCollections: number
  maxAiRequestsPerDay: number
  allowAllergiesAndDiets: boolean
  descriptionFeatures: string[]
}

export interface PlanConfig {
  planType: PlanType
  name: string
  price: number
  currency: Currency
  description: string
  features: PlanFeatures
}

export interface SubscriptionResponseDto {
  id: string
  user: {
    id: string
    displayname?: string
    username?: string
  }
  planType: string
  status: string
  currentPeriodEnd: string
}

export interface PaymentResponseDto {
  id: string
  user: {
    id: string
    displayname?: string
    username?: string
  }
  amount: number
  currency: string
  status: string
  createdAt: string
}
