import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeCollection } from './entities/recipe-collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { SubscriptionService } from '../billing/services/subscription.service';
import { Recipe } from '../recipe/entities/recipe.entity';

@Injectable()
export class RecipeCollectionService {
  constructor(
    @InjectRepository(RecipeCollection)
    private readonly collectionRepository: Repository<RecipeCollection>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(
    userId: string,
    dto: CreateCollectionDto,
  ): Promise<RecipeCollection> {
    const collection = this.collectionRepository.create({
      ...dto,
      userId,
    });

    return this.collectionRepository.save(collection);
  }

  async findAll(userId: string): Promise<RecipeCollection[]> {
    return this.collectionRepository.find({
      where: { userId },
      order: { isSystem: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<RecipeCollection> {
    const collection = await this.collectionRepository.findOne({
      where: { id, userId },
      relations: ['recipes'],
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCollectionDto,
  ): Promise<RecipeCollection> {
    const collection = await this.findOne(userId, id);

    if (collection.isSystem && dto.name && dto.name !== collection.name) {
      throw new BadRequestException('Cannot rename system collection');
    }

    Object.assign(collection, dto);
    return this.collectionRepository.save(collection);
  }

  async remove(userId: string, id: string): Promise<void> {
    const collection = await this.findOne(userId, id);

    if (collection.isSystem) {
      throw new BadRequestException('Cannot delete system collection');
    }

    await this.collectionRepository.remove(collection);
  }

  async addRecipe(
    userId: string,
    collectionId: string,
    recipeId: string,
  ): Promise<RecipeCollection> {
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId, userId },
      relations: ['recipes'],
    });

    if (!collection) throw new NotFoundException('Collection not found');

    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    if (collection.recipes.some((r) => r.id === recipeId)) {
      return collection;
    }

    collection.recipes.push(recipe);
    return this.collectionRepository.save(collection);
  }

  async removeRecipe(
    userId: string,
    collectionId: string,
    recipeId: string,
  ): Promise<RecipeCollection> {
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId, userId },
      relations: ['recipes'],
    });

    if (!collection) throw new NotFoundException('Collection not found');

    collection.recipes = collection.recipes.filter((r) => r.id !== recipeId);
    return this.collectionRepository.save(collection);
  }

  async createSystemFavorites(userId: string): Promise<RecipeCollection> {
    const favorites = this.collectionRepository.create({
      name: 'Улюблене',
      userId,
      isSystem: true,
      description: 'Ваша звичайна колекція улюблених рецептів!',
    });
    return this.collectionRepository.save(favorites);
  }
}
