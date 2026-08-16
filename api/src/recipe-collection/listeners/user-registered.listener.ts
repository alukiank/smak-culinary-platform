import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RecipeCollectionService } from '../recipe-collection.service';

@Injectable()
export class UserRegisteredListener {
  constructor(private readonly collectionService: RecipeCollectionService) {}

  @OnEvent('user.registered')
  async handleUserCreated(payload: { userId: string }) {
    await this.collectionService.createSystemFavorites(payload.userId);
  }
}
