export const QUEUE_NAMES = {
  RECIPE_INDEXING: 'recipe-indexing',
  RECIPE_PREMODERATION: 'recipe-premoderation',
  RECIPE_REVIEW_PREMODERATION: 'recipe-review-premoderation',
  CLOUDINARY_CLEANUP: 'cloudinary-cleanup',
} as const;

export const DEFAULT_JOB_OPTIONS = {
  removeOnComplete: {
    count: 100,
    age: 3600 * 24 * 7, // 1 week
  },
  removeOnFail: false,
} as const;

export const BULL_BOARD_ROUTE = '/admin/queues';
