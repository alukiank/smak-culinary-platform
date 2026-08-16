import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserPrivateDto } from '../../user/dto/user-private.dto';

@Injectable()
export class IsBannedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPrivateDto;

    if (user && user.isBanned) {
      throw new ForbiddenException('Your account has been banned.');
    }

    return true;
  }
}
