import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserRoleEnum } from './enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepo: jest.Mocked<Repository<User>>;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      preload: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateUserDto = {
      username: 'andrii',
      displayname: 'Andrii L',
      email: 'andrii@smak.ua',
      password: 'RawPassword123!',
      role: UserRoleEnum.USER,
      dietary: [],
      allergies: [],
    };

    it('should hash the raw password using argon2 and store passwordHash, not plain password', async () => {
      const createdEntity = {
        id: 'usr-123',
        username: createDto.username,
        email: createDto.email,
        passwordHash: expect.any(String),
      };

      userRepo.create.mockImplementation((data: any) => data);
      userRepo.save.mockImplementation(async (entity: any) => ({
        id: 'usr-123',
        ...entity,
      }));

      const result = await service.create(createDto);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: createDto.username,
          email: createDto.email,
          passwordHash: expect.any(String),
        }),
      );

      // Verify that plain text password is NOT stored
      expect((userRepo.create.mock.calls[0][0] as any).password).toBeUndefined();

      // Verify real argon2 hashing produces a valid hash that verifies with the original password
      const savedHash = (userRepo.create.mock.calls[0][0] as any).passwordHash;
      const isValid = await argon2.verify(savedHash, createDto.password);
      expect(isValid).toBe(true);

      expect(result.id).toBe('usr-123');
    });
  });

  describe('findUserRestrictions', () => {
    it('should return user dietary and allergies', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'usr-1',
        allergies: ['peanuts'],
        dietary: ['vegan'],
      } as User);

      const result = await service.findUserRestrictions('usr-1');

      expect(result).toEqual({
        allergies: ['peanuts'],
        dietary: ['vegan'],
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findUserRestrictions('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
