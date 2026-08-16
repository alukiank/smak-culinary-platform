import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserPrivateDto } from '../../user/dto/user-private.dto';

@Injectable()
export class EmailVerificationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPrivateDto;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Please verify your email to access this resource',
      );
    }

    return true;
  }
}
