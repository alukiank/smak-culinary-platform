import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { RATE_LIMITS } from './rate-limiting.constants';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([
      RATE_LIMITS.SHORT,
      RATE_LIMITS.MEDIUM,
      RATE_LIMITS.LONG,
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class RateLimitingModule {}
