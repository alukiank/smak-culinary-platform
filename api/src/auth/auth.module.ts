import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthCacheService } from './services/auth-cache.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';
import { SessionListener } from './listeners/session.listener';
import { IsBannedGuard } from './guards/is-banned.guard';

@Module({
  imports: [UserModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCacheService,
    LocalStrategy,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    TokenService,
    VerificationService,
    SessionListener,
    {
      provide: APP_GUARD,
      useClass: IsBannedGuard,
    },
  ],
  exports: [AuthService, AuthCacheService],
})
export class AuthModule {}
