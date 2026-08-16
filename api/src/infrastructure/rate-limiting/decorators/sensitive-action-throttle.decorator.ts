import { Throttle } from '@nestjs/throttler';

export const SensitiveActionThrottle = () =>
  Throttle({
    short: { limit: 2, ttl: 1000 },
    medium: { limit: 5, ttl: 10000 },
    long: { limit: 10, ttl: 60000 },
  });
