import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserRoleEnum } from '../../user/enums/user-role.enum';
import { UserPrivateDto } from '../../user/dto/user-private.dto';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as UserPrivateDto;

    if (!user) {
      return res.status(401).send('Unauthorized: You must be logged in.');
    }

    if (user.role === UserRoleEnum.ADMIN) {
      return next();
    }

    return res.status(403).send('Forbidden: Access denied. Admins only.');
  }
}
