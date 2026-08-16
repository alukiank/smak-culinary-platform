import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { RecipeCollectionService } from './recipe-collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CollectionLimitGuard } from './guards/collection-limit.guard';

@ApiTags('Recipe Collections')
@ApiCookieAuth('jwt-access')
@UseGuards(AuthGuard('jwt-access'))
@Controller('recipe-collections')
export class RecipeCollectionController {
  constructor(private readonly collectionService: RecipeCollectionService) {}

  @UseGuards(CollectionLimitGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new recipe collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully.' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Subscription limit reached. Max collections allowed: 1 for Free (the system favorites folder, so Free users cannot create custom collections), 10 for Pro, unlimited for Premium.',
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCollectionDto) {
    return this.collectionService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my recipe collections' })
  @ApiResponse({ status: 200, description: 'List of user collections.' })
  findAll(@CurrentUser('id') userId: string) {
    return this.collectionService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific collection with recipes' })
  @ApiResponse({ status: 200, description: 'Collection details with recipes.' })
  @ApiResponse({ status: 404, description: 'Collection not found.' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.collectionService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update collection details' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully.' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection' })
  @ApiResponse({ status: 200, description: 'Collection deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Cannot delete system collection.' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.collectionService.remove(userId, id);
  }

  @Post(':id/recipes/:recipeId')
  @ApiOperation({ summary: 'Add a recipe to a collection' })
  @ApiResponse({ status: 200, description: 'Recipe added successfully.' })
  addRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
  ) {
    return this.collectionService.addRecipe(userId, id, recipeId);
  }

  @Delete(':id/recipes/:recipeId')
  @ApiOperation({ summary: 'Remove a recipe from a collection' })
  @ApiResponse({ status: 200, description: 'Recipe removed successfully.' })
  removeRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
  ) {
    return this.collectionService.removeRecipe(userId, id, recipeId);
  }
}
