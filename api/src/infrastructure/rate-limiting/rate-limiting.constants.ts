export const RATE_LIMITS = {
  SHORT: { name: 'short', ttl: 1000, limit: 20 },
  MEDIUM: { name: 'medium', ttl: 10000, limit: 60 },
  LONG: { name: 'long', ttl: 60000, limit: 120 },
} as const;
