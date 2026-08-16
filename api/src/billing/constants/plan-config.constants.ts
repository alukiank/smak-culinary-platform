import { PlanType } from '../enums/subscription-plan.enum';
import { Currency } from '../enums/currency.enum';
import { PlanConfig } from '../interfaces/subscription-plan-config.interface';

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  [PlanType.FREE]: {
    planType: PlanType.FREE,
    name: 'Free',
    price: 0,
    currency: Currency.UAH,
    description: 'Basic free',
    features: {
      maxCollections: 1,
      maxAiRequestsPerDay: 10,
      allowAllergiesAndDiets: false,
      descriptionFeatures: [
        'Recipe view',
        'Basic AI assistant',
        'Save up to 1 collection',
      ],
    },
  },
  [PlanType.PRO]: {
    planType: PlanType.PRO,
    name: 'Pro',
    price: 149,
    currency: Currency.UAH,
    description: 'Expanded access',
    features: {
      maxCollections: 10,
      maxAiRequestsPerDay: 50,
      allowAllergiesAndDiets: true,
      descriptionFeatures: [
        'Unlimited recipe saves',
        'Full AI assistant',
        'No ads',
        'Priority recipe processing',
        'Save up to 10 collections',
      ],
    },
  },
  [PlanType.PREMIUM]: {
    planType: PlanType.PREMIUM,
    name: 'Premium',
    price: 299,
    currency: Currency.UAH,
    description: 'Full access',
    features: {
      maxCollections: Infinity,
      maxAiRequestsPerDay: Infinity,
      allowAllergiesAndDiets: true,
      descriptionFeatures: [
        'All Pro features',
        'Priority support',
        'Exclusive content',
        'Early access to new features',
        'Save up to unlimited collections',
      ],
    },
  },
};
