import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardAuthMiddleware } from '../../shared/middlewares/bull-board-auth.middleware';
import * as passport from 'passport';
import { Redis } from 'ioredis';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import {
  QUEUE_NAMES,
  DEFAULT_JOB_OPTIONS,
  BULL_BOARD_ROUTE,
} from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: ['REDIS_CLIENT'],
      useFactory: (redisClient: Redis) => ({
        connection: redisClient,
      }),
    }),
    BullBoardModule.forRoot({
      route: BULL_BOARD_ROUTE,
      adapter: ExpressAdapter,
      middleware: [
        passport.authenticate('jwt-access', { session: false }),
        BullBoardAuthMiddleware,
      ],
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.RECIPE_INDEXING,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.RECIPE_PREMODERATION,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.RECIPE_REVIEW_PREMODERATION,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
      {
        name: QUEUE_NAMES.CLOUDINARY_CLEANUP,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      },
    ),
    BullBoardModule.forFeature(
      { name: QUEUE_NAMES.RECIPE_INDEXING, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.RECIPE_PREMODERATION, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.RECIPE_REVIEW_PREMODERATION, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.CLOUDINARY_CLEANUP, adapter: BullMQAdapter },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
