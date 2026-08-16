import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { Response } from 'express';
import { User } from '../../user/entities/user.entity';
import { AuthCacheService } from './auth-cache.service';
import * as argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';
import { UserPrivateDto } from '../../user/dto/user-private.dto';
import { TokenService } from './token.service';
import { SignupDto } from '../dto/signup.dto';
import { randomBytes } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRoleEnum } from '../../user/enums/user-role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly AuthCacheService: AuthCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async signup(
    { username, displayname, email, password }: SignupDto,
    res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const existingUserByEmail = await this.userService.findOne({ email });
    const existingUserByUsername = await this.userService.findOne({ username });

    if (existingUserByUsername) {
      throw new ConflictException('User with this username already exists!');
    }
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists!');
    }

    const createdUser = await this.userService.create({
      username,
      displayname,
      email,
      password,
      role: UserRoleEnum.USER,
      dietary: [],
      allergies: [],
    });

    const verificationToken = randomBytes(32).toString('hex');
    await this.AuthCacheService.createVerificationToken(
      createdUser.id,
      verificationToken,
    );

    this.logger.log(
      `[Auth] New user registered: ${createdUser.email} (Username: ${createdUser.username})`,
    );
    this.eventEmitter.emit('user.registered', {
      userId: createdUser.id,
      email: createdUser.email,
      token: verificationToken,
      user: createdUser,
    });

    await this.AuthCacheService.createSession(createdUser);

    return await this.tokenService.generateAndSetTokens(createdUser.id, res);
  }

  async login(
    user: User,
    res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!user) throw new ConflictException();
    this.logger.log(`[Auth] User logged in: ${user.email} (ID: ${user.id})`);
    await this.AuthCacheService.createSession(user);
    return await this.tokenService.generateAndSetTokens(user.id, res);
  }

  async logout(id: string, res: Response): Promise<boolean> {
    this.logger.log(`[Auth] User logout initiated for ID: ${id}`);
    await this.AuthCacheService.invalidateUserSession(id);
    this.tokenService.clearTokens(res);
    return true;
  }

  async me(id: string): Promise<UserPrivateDto> {
    const userSession = await this.AuthCacheService.findSession(id);
    if (userSession) return userSession;

    const user = await this.userService.findOne({ id });
    if (!user) throw new NotFoundException();

    return plainToInstance(UserPrivateDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async validateUser(email: string, password: string) {
    const userByEmail = await this.userService.findOne({ email });
    if (!userByEmail) {
      this.logger.warn(
        `[Auth] Login failed: User with email ${email} not found.`,
      );
      return null;
    }

    const isValidPassword = await argon2.verify(
      userByEmail.passwordHash,
      password,
    );
    if (!isValidPassword) {
      this.logger.warn(
        `[Auth] Login failed: Invalid password for user ${email}.`,
      );
      return null;
    }

    return userByEmail;
  }
}
