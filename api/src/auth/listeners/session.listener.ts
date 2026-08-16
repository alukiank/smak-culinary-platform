import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthCacheService } from '../services/auth-cache.service';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/user.service';
@Injectable()
export class SessionListener {
  private readonly logger = new Logger(SessionListener.name);

  constructor(
    private readonly authCacheService: AuthCacheService,
    private readonly userService: UserService,
  ) {}

  @OnEvent('user.updated')
  async handleUserUpdatedEvent(user: User) {
    this.logger.log(
      `[Session] Profile updated for user ${user.id}. Syncing Redis session data.`,
    );
    const fullUser = await this.userService.findOne({ id: user.id });
    if (fullUser) {
      await this.authCacheService.updateSession(fullUser);
    } else {
      await this.authCacheService.updateSession(user);
    }
  }

  @OnEvent('user.password-changed')
  async handleUserPasswordChangedEvent(userId: string) {
    this.logger.log(
      `[Session] Password changed for user ${userId}. Invalidating current session.`,
    );
    await this.authCacheService.invalidateUserSession(userId);
  }

  @OnEvent('user.deleted')
  async handleUserDeletedEvent(userId: string) {
    this.logger.log(
      `[Session] User ${userId} deleted. Removing all sessions from Redis.`,
    );
    await this.authCacheService.invalidateUserSession(userId);
  }
}
