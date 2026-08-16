import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { RecipeService } from '../../recipe/recipe.service';
import { ToolExecutionResponse } from '../interfaces/tool-execution.response.interface';
import { Recipe } from '../../recipe/entities/recipe.entity';
import { RecipeStatusEnum } from '../../recipe/enums/recipe-status.enum';

@Injectable()
export class ToolHandlerService {
  private readonly logger = new Logger(ToolHandlerService.name);

  private readonly searchHistory = new Map<
    string,
    { filtersHash: string; lastPage: number }
  >();

  constructor(
    private readonly recipeService: RecipeService,
    private readonly configService: ConfigService,
  ) { }

  async executeFunctionCall(
    functionName: string,
    args: any,
    chatId?: string,
  ): Promise<ToolExecutionResponse> {
    try {
      switch (functionName) {
        case 'search_recipes': {
          args.status = RecipeStatusEnum.PUBLIC;

          if (chatId) {
            const hash = this.getFiltersHash(args);
            const lastSearch = this.searchHistory.get(chatId);

            let pageToUse = args.page || 1;

            if (lastSearch && lastSearch.filtersHash === hash) {
              // Same search query and filters, auto-increment the page number
              pageToUse = lastSearch.lastPage + 1;
              this.logger.log(
                `[Chat:${chatId}] Repeated search with same filters detected. Incrementing page to ${pageToUse}`,
              );
            } else {
              this.logger.log(
                `[Chat:${chatId}] New search or different filters. Starting with page ${pageToUse}`,
              );
            }

            args.page = pageToUse;
            this.searchHistory.set(chatId, {
              filtersHash: hash,
              lastPage: pageToUse,
            });
          }

          let wrappedAround = false;
          let paginatedResult =
            await this.recipeService.searchRecipesWithFilters(args);

          // If the page was incremented but returned no results, wrap around to page 1
          if (paginatedResult.data.length === 0 && args.page > 1) {
            this.logger.log(
              `[Chat:${chatId}] Page ${args.page} returned 0 results. Wrapping around to page 1.`,
            );
            wrappedAround = true;
            args.page = 1;
            paginatedResult =
              await this.recipeService.searchRecipesWithFilters(args);
            if (chatId) {
              this.searchHistory.set(chatId, {
                filtersHash: this.getFiltersHash(args),
                lastPage: 1,
              });
            }
          }

          const safeRecipesForAi = paginatedResult.data.map((recipe) =>
            this.sanitizeRecipeForSearch(recipe),
          );

          if (wrappedAround) {
            return {
              result: {
                warning: "All new recipes for this search query/filters have been exhausted. Do NOT repeat the same recipes from earlier. Inform the user in a friendly manner that you have already shown all available recipes for their criteria.",
              }
            };
          }

          return {
            result: safeRecipesForAi,
          };
        }

        case 'get_recipe_details': {
          const recipe = await this.recipeService.findOne(args.id);

          if (!recipe) {
            return { result: { error: `Recipe with ID ${args.id} not found.` } };
          }

          const safeResult = this.sanitizeRecipeForDetails(recipe);

          return { result: safeResult };
        }

        case 'display_recipes': {
          const recipeIds: string[] = args.recipeIds || [];

          const recipes = await Promise.all(
            recipeIds.map((id) => this.recipeService.findOne(id).catch(() => null)),
          );

          const confirmed = recipes.filter(
            (r) => r !== null && r.status === RecipeStatusEnum.PUBLIC,
          );

          return {
            result: {
              displayed: confirmed.length,
              ...(recipeIds.length !== confirmed.length && {
                warning: `${recipeIds.length - confirmed.length} recipe ID(s) were invalid or not public. Only use IDs from search_recipes results.`,
                invalidIds: recipeIds.filter(id => !confirmed.some(r => r.id === id)),
              }),
            },
            clientMetadata:
              confirmed.length > 0
                ? {
                  recipes: confirmed.map((r) => ({
                    id: r.id,
                    title: r.title,
                    rating: r.rating || 0,
                    coverImageId: r.coverImageId,
                    cookTime: r.cookTime,
                    difficulty: r.difficulty,
                    description: r.description,
                    category: r.category,
                  })),
                }
                : undefined,
          };
        }

        case 'get_site_documentation': {
          const format = args.format || 'markdown';
          const fileName = format === 'json' ? 'site-structure.json' : 'site-docs.md';
          const frontendUrl = this.configService.get<string>('FRONTEND_GATEWAY') || this.configService.get<string>('FRONTEND_URL');
          const url = `${frontendUrl}/${fileName}`;

          this.logger.log(`Fetching site documentation in format "${format}" from ${url}...`);

          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.text();
            this.logger.log(`Successfully fetched site documentation over HTTP.`);

            if (format === 'json') {
              try {
                return { result: { format: 'json', structure: JSON.parse(data) } };
              } catch (e) {
                return { result: { format: 'json', raw: data } };
              }
            }
            return { result: { format: 'markdown', content: data } };
          } catch (error) {
            this.logger.warn(`Failed to fetch documentation via HTTP (${error.message}). Falling back to local filesystem...`);

            const localPath = path.resolve(process.cwd(), `../client/public/${fileName}`);
            try {
              if (fs.existsSync(localPath)) {
                const fileContent = fs.readFileSync(localPath, 'utf8');
                this.logger.log(`Successfully read site documentation from local path: ${localPath}`);

                if (format === 'json') {
                  try {
                    return { result: { format: 'json', structure: JSON.parse(fileContent) } };
                  } catch (e) {
                    return { result: { format: 'json', raw: fileContent } };
                  }
                }
                return { result: { format: 'markdown', content: fileContent } };
              } else {
                throw new Error(`Local file not found at path: ${localPath}`);
              }
            } catch (fsError) {
              this.logger.error(`Failed to read documentation from filesystem: ${fsError.message}`);
              return {
                result: {
                  error: `Could not retrieve site documentation. HTTP fetch and local fallback both failed. Detail: ${fsError.message}`,
                },
              };
            }
          }
        }

        case 'display_user_diets': {
          this.logger.log(`Executing display_user_diets tool`);
          return {
            result: { success: true },
            clientMetadata: { showDiets: true },
          };
        }

        case 'display_user_allergies': {
          this.logger.log(`Executing display_user_allergies tool`);
          return {
            result: { success: true },
            clientMetadata: { showAllergies: true },
          };
        }

        default:
          this.logger.warn(
            `Model tried to call unknown function: "${functionName} " with args: ${JSON.stringify(args)}`,
          );
          return {
            result: { error: `Function ${functionName} is not implemented.` },
          };
      }
    } catch (error) {
      this.logger.error(
        `Error executing tool ${functionName} with args ${JSON.stringify(args)}: ${error.message}`,
        error.stack,
      );
      return {
        result: {
          error: `Failed to execute tool ${functionName} due to internal error: ${error.message}. If invalid id was used, try to use search tools and repeat the request with valid ids.`,
        },
      };
    }
  }

  private sanitizeRecipeForSearch(recipe: Recipe) {
    if (!recipe) return null;
    return {
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
      description: recipe.description?.substring(0, 150),
      difficulty: recipe.difficulty,
      cookTime: recipe.cookTime,
      rating: recipe.rating || 0,
    };
  }

  private sanitizeRecipeForDetails(recipe: Recipe) {
    if (!recipe) return null;

    return {
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
      description: recipe.description,
      difficulty: recipe.difficulty,
      cookSpeed: recipe.cookSpeed,
      cookTime: recipe.cookTime,
      rating: recipe.rating || 0,

      ingredients: recipe.ingredients,
      instructions: recipe.directions,
      cuisineList: recipe.cuisineList,
      tastes: recipe.tastes,
      ...(recipe.isVegan && { isVegan: true }),
      ...(recipe.isVegetarian && { isVegetarian: true }),
      ...(recipe.isGluten_free && { isGluten_free: true }),
      ...(recipe.isHalal && { isHalal: true }),
      ...(recipe.isKosher && { isKosher: true }),
      ...(recipe.isDairyFree && { isDairyFree: true }),
      ...(recipe.isNutFree && { isNutFree: true }),

      healthScore: recipe.healthScore,

      authorName: recipe.user?.displayname || 'Unknown Author',
    };
  }

  private getFiltersHash(args: any): string {
    const { page, limit, status, ...rest } = args;
    const sortedRest = Object.keys(rest)
      .sort()
      .reduce((acc, key) => {
        acc[key] = rest[key];
        return acc;
      }, {} as any);
    return JSON.stringify(sortedRest);
  }
}
