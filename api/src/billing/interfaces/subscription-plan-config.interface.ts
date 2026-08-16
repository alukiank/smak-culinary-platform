import { PlanType } from '../enums/subscription-plan.enum';
import { Currency } from '../enums/currency.enum';

export interface PlanFeatures {
  maxCollections: number;
  maxAiRequestsPerDay: number;
  allowAllergiesAndDiets: boolean;
  descriptionFeatures: string[];
}

export interface PlanConfig {
  planType: PlanType;
  name: string;
  price: number;
  currency: Currency;
  description: string;
  features: PlanFeatures;
}
