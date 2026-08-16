import { z } from 'zod';

export const ModerationResponseSchema = z.object({
  decision: z
    .enum(['APPROVED', 'REJECTED', 'FLAGGED'])
    .describe(
      'The final decision of the moderation process. ' +
        'APPROVED: The recipe is safe, edible, and contains no harmful/spam content. ' +
        'REJECTED: The recipe contains explicit spam, non-edible/toxic ingredients, or extreme profanity. ' +
        'FLAGGED: You are unsure, the recipe contains suspicious elements, or it requires human review.',
    ),

  reason: z
    .string()
    .optional()
    .describe(
      'A detailed explanation of your decision. ' +
        'CRITICAL: If the decision is REJECTED or FLAGGED, you MUST provide a clear reason explaining what exact rules were violated or what ingredients are suspicious. ' +
        'If the decision is APPROVED, you can leave this empty or provide a brief positive note.',
    ),

  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Your confidence level in this decision, represented as a float between 0.0 and 1.0. ' +
        'For example, 0.95 means highly confident, while 0.6 means you have doubts.',
    ),
});

export type ModerationResponse = z.infer<typeof ModerationResponseSchema>;
