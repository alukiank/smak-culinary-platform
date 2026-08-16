export const REDIS_PREFIXES = {
  SESSION: 'user:session:',
  VERIFY_EMAIL: 'verify-email:',
  RESET_PASSWORD: 'reset-password:',
} as const;

export const REDIS_TTL = {
  SESSION_BUFFER_SECONDS: 10, // Buffer time to account for clock skew and processing delays
  VERIFY_EMAIL_SECONDS: 3600 * 24, // 24 hours
  RESET_PASSWORD_SECONDS: 3600, // 1 hours
} as const;
