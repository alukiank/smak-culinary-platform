import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecipeService } from './recipe.service';
import { Recipe } from './entities/recipe.entity';
import { RecipeVector } from './entities/recipe-vector.entity';
import { EmbedderService } from '../embedder/embedder.service';
import { RecipeReviewService } from '../recipe-review/recipe-review.service';
import { RecipeStatusEnum } from './enums/recipe-status.enum';
import { CategoryEnum } from './enums/recipe-category.enum';
import { DifficultyEnum } from './enums/recipe-difficulty.enum';
import { CookSpeedEnum } from './enums/recipe-cook-speed.enum';
import { CreateRecipeDto } from './dto/recipe-create.dto';
import { UpdateRecipeDto } from './dto/recipe-update.dto';

describe('RecipeService', () => {
  let service: RecipeService;
  let recipeRepo: jest.Mocked<Repository<Recipe>>;
  let vectorRepo: jest.Mocked<Repository<RecipeVector>>;
  let embedderService: { embedQuery: jest.Mock };
  let eventEmitter: { emit: jest.Mock };
  let recipeReviewService: { getAllImageIdsByRecipe: jest.Mock };

  let mockQueryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      create: jest.Mock;
      save: jest.Mock;
      findOne: jest.Mock;
      merge: jest.Mock;
    };
  };

  let mockDataSource: {
    createQueryRunner: jest.Mock;
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        merge: jest.fn((entityClass, entity, dto) => Object.assign(entity, dto)),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      transaction: jest.fn(),
    };

    recipeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    vectorRepo = {
      findOne: jest.fn(),
    } as any;

    embedderService = {
      embedQuery: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    recipeReviewService = {
      getAllImageIdsByRecipe: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(Recipe), useValue: recipeRepo },
        { provide: getRepositoryToken(RecipeVector), useValue: vectorRepo },
        { provide: EmbedderService, useValue: embedderService },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: RecipeReviewService, useValue: recipeReviewService },
      ],
    }).compile();

    service = module.get<RecipeService>(RecipeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateRecipeDto = {
      title: 'Borscht',
      description: 'Traditional Ukrainian soup',
      prepTime: 20,
      cookTime: 60,
      servings: 4,
      category: CategoryEnum.SOUPS_AND_STEWS,
      difficulty: DifficultyEnum.MEDIUM,
      cookSpeed: CookSpeedEnum.MEDIUM,
      ingredients: [{ name: 'Beetroot', amount: 2, unit: 'pcs' }] as any,
      directions: [{ step: 1, text: 'Chop beetroot' }] as any,
    } as any;

    it('should create recipe inside transaction, commit, emit recipe.created and release runner', async () => {
      const savedRecipe = { id: 'rec-1', ...createDto, user: { id: 'usr-1' } };

      mockQueryRunner.manager.create.mockReturnValue(savedRecipe);
      mockQueryRunner.manager.save.mockResolvedValue(savedRecipe);

      const result = await service.create(createDto, 'usr-1');

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(Recipe, {
        ...createDto,
        user: { id: 'usr-1' },
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(savedRecipe);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('recipe.created', savedRecipe);
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(savedRecipe);
    });

    it('should rollback transaction and throw InternalServerErrorException on error', async () => {
      mockQueryRunner.manager.create.mockReturnValue({});
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB failure'));

      await expect(service.create(createDto, 'usr-1')).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdateRecipeDto = {
      title: 'Updated Borscht',
      ingredients: [{ name: 'Beetroot', amount: 3, unit: 'pcs' }] as any,
    };

    it('should throw NotFoundException and rollback if recipe does not exist', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should detect content change, move PUBLIC recipe back to PREMODERATION, commit and emit recipe.updated', async () => {
      const existingRecipe = {
        id: 'rec-1',
        title: 'Old Borscht',
        status: RecipeStatusEnum.PUBLIC,
        ingredients: [{ name: 'Beetroot', amount: 1, unit: 'pcs' }],
        coverImageId: 'old-cover.jpg',
        galleryImageIds: ['img1.jpg'],
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(existingRecipe);
      mockQueryRunner.manager.save.mockImplementation(async (r) => r);

      const result = await service.update('rec-1', updateDto);

      expect(result.status).toBe(RecipeStatusEnum.PREMODERATION);
      expect(result.title).toBe('Updated Borscht');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('recipe.updated', {
        recipe: expect.objectContaining({
          id: 'rec-1',
          status: RecipeStatusEnum.PREMODERATION,
        }),
        isContentChanged: true,
        oldCoverImageId: 'old-cover.jpg',
        oldGalleryImageIds: ['img1.jpg'],
      });
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should keep recipe status if content has not changed (e.g. only non-content changes)', async () => {
      const existingRecipe = {
        id: 'rec-1',
        title: 'Same Borscht',
        status: RecipeStatusEnum.PUBLIC,
        ingredients: [{ name: 'Beetroot', amount: 2, unit: 'pcs' }],
        directions: [{ step: 1, text: 'Chop' }],
        coverImageId: 'cover.jpg',
        galleryImageIds: [],
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(existingRecipe);
      mockQueryRunner.manager.save.mockImplementation(async (r) => r);

      // Sending same title and ingredients
      const noContentChangeDto: UpdateRecipeDto = {
        title: 'Same Borscht',
      };

      const result = await service.update('rec-1', noContentChangeDto);

      expect(result.status).toBe(RecipeStatusEnum.PUBLIC);
      expect(eventEmitter.emit).toHaveBeenCalledWith('recipe.updated', {
        recipe: expect.any(Object),
        isContentChanged: false,
        oldCoverImageId: 'cover.jpg',
        oldGalleryImageIds: [],
      });
    });
  });

  describe('updateStatus', () => {
    it('should update status and emit recipe.status.changed event', async () => {
      recipeRepo.update.mockResolvedValue({ affected: 1 } as any);
      const recipe = { id: 'rec-1', status: RecipeStatusEnum.PUBLIC } as Recipe;
      recipeRepo.findOne.mockResolvedValue(recipe);

      const result = await service.updateStatus('rec-1', RecipeStatusEnum.PUBLIC);

      expect(recipeRepo.update).toHaveBeenCalledWith('rec-1', {
        status: RecipeStatusEnum.PUBLIC,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('recipe.status.changed', recipe);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException if recipe to update status is not found', async () => {
      recipeRepo.update.mockResolvedValue({ affected: 0 } as any);

      await expect(
        service.updateStatus('unknown', RecipeStatusEnum.PUBLIC),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne & findByIds', () => {
    it('should return recipe with user relation', async () => {
      const recipe = { id: 'rec-1', title: 'Soup', user: { id: 'u-1' } } as Recipe;
      recipeRepo.findOne.mockResolvedValue(recipe);

      const result = await service.findOne('rec-1');

      expect(recipeRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        relations: ['user'],
      });
      expect(result).toEqual(recipe);
    });

    it('should throw NotFoundException when recipe not found', async () => {
      recipeRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('rec-999')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when ids array is empty', async () => {
      const result = await service.findByIds([]);
      expect(result).toEqual([]);
      expect(recipeRepo.find).not.toHaveBeenCalled();
    });

    it('should find recipes by array of ids', async () => {
      const recipes = [{ id: 'rec-1' }, { id: 'rec-2' }] as Recipe[];
      recipeRepo.find.mockResolvedValue(recipes);

      const result = await service.findByIds(['rec-1', 'rec-2']);

      expect(recipeRepo.find).toHaveBeenCalledWith({
        where: { id: In(['rec-1', 'rec-2']) },
      });
      expect(result).toEqual(recipes);
    });
  });

  describe('remove', () => {
    it('should delete recipe and emit recipe.deleted with reviewImageIds', async () => {
      const recipe = { id: 'rec-1', title: 'Delete me' } as Recipe;
      recipeRepo.findOne.mockResolvedValue(recipe);
      recipeReviewService.getAllImageIdsByRecipe.mockResolvedValue(['rev-img-1']);
      recipeRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove('rec-1');

      expect(recipeRepo.delete).toHaveBeenCalledWith('rec-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith('recipe.deleted', {
        recipe,
        reviewImageIds: ['rev-img-1'],
      });
      expect(result).toBe(true);
    });

    it('should throw NotFoundException if delete affected 0 rows', async () => {
      const recipe = { id: 'rec-1' } as Recipe;
      recipeRepo.findOne.mockResolvedValue(recipe);
      recipeReviewService.getAllImageIdsByRecipe.mockResolvedValue([]);
      recipeRepo.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('rec-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('banRecipesByUser', () => {
    it('should reject active recipes belonging to banned user', async () => {
      await service.banRecipesByUser('usr-banned');

      expect(recipeRepo.update).toHaveBeenCalledWith(
        {
          user: { id: 'usr-banned' },
          status: In([
            RecipeStatusEnum.PUBLIC,
            RecipeStatusEnum.PREMODERATION,
            RecipeStatusEnum.MODERATION,
          ]),
        },
        { status: RecipeStatusEnum.REJECTED },
      );
    });
  });

  describe('searchRecipesWithFilters', () => {
    let mockSearchQb: any;

    beforeEach(() => {
      mockSearchQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'rec-1' }], 1]),
      };
      recipeRepo.createQueryBuilder = jest.fn().mockReturnValue(mockSearchQb);
    });

    it('should perform vector cosine distance search when semantic query is provided', async () => {
      const queryVector = [0.12, 0.34, 0.56];
      embedderService.embedQuery.mockResolvedValue(queryVector);

      const result = await service.searchRecipesWithFilters({
        query: 'delicious soup',
        page: 2,
        limit: 5,
        status: RecipeStatusEnum.PUBLIC,
        category: CategoryEnum.SOUPS_AND_STEWS,
        difficulty: DifficultyEnum.EASY,
        cookSpeed: CookSpeedEnum.FAST,
        isVegan: true,
        minHealthScore: 70,
        maxCookTime: 45,
      });

      expect(embedderService.embedQuery).toHaveBeenCalledWith('delicious soup');
      expect(mockSearchQb.innerJoin).toHaveBeenCalledWith('recipe.vector', 'vector');
      expect(mockSearchQb.addSelect).toHaveBeenCalledWith(
        'vector.embedding <=> :queryVector::vector',
        'distance',
      );
      expect(mockSearchQb.andWhere).toHaveBeenCalledWith(
        'vector.embedding <=> :queryVector::vector <= 0.4',
      );
      expect(mockSearchQb.setParameter).toHaveBeenCalledWith(
        'queryVector',
        JSON.stringify(queryVector),
      );
      expect(mockSearchQb.orderBy).toHaveBeenCalledWith('distance', 'ASC');

      // Check strict filter applications
      expect(mockSearchQb.andWhere).toHaveBeenCalledWith('recipe.status = :status', {
        status: RecipeStatusEnum.PUBLIC,
      });
      expect(mockSearchQb.andWhere).toHaveBeenCalledWith('recipe.category = :category', {
        category: CategoryEnum.SOUPS_AND_STEWS,
      });
      expect(mockSearchQb.andWhere).toHaveBeenCalledWith('recipe.difficulty = :difficulty', {
        difficulty: DifficultyEnum.EASY,
      });
      expect(mockSearchQb.andWhere).toHaveBeenCalledWith('recipe.isVegan = :isVegan', {
        isVegan: true,
      });
      expect(mockSearchQb.andWhere).toHaveBeenCalledWith('recipe.healthScore >= :minHealthScore', {
        minHealthScore: 70,
      });
      expect(mockSearchQb.andWhere).toHaveBeenCalledWith(
        '(recipe.cookTime + recipe.prepTime) <= :maxCookTime',
        { maxCookTime: 45 },
      );

      expect(mockSearchQb.skip).toHaveBeenCalledWith(5); // (page 2 - 1) * 5
      expect(mockSearchQb.take).toHaveBeenCalledWith(5);
      expect(result.data).toEqual([{ id: 'rec-1' }]);
      expect(result.meta.totalItems).toBe(1);
    });

    it('should order by recipe.createdAt DESC when no semantic query is provided', async () => {
      await service.searchRecipesWithFilters({
        page: 1,
        limit: 10,
      });

      expect(embedderService.embedQuery).not.toHaveBeenCalled();
      expect(mockSearchQb.orderBy).toHaveBeenCalledWith('recipe.createdAt', 'DESC');
    });
  });

  describe('updateRecipeRating', () => {
    it('should execute transaction with pessimistic_write lock and update rounded rating', async () => {
      const mockManagerQb = {
        where: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'rec-1' }),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          averageRating: '4.67',
          totalRatings: '15',
        }),
      };

      const mockManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockManagerQb),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockDataSource.transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await service.updateRecipeRating('rec-1');

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManagerQb.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(mockManager.update).toHaveBeenCalledWith(Recipe, 'rec-1', {
        rating: 4.7, // 4.67 rounded to 1 decimal place
        numRatings: 15,
      });
    });
  });
});
