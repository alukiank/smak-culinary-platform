import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt-access') {
  handleRequest(err, user) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
