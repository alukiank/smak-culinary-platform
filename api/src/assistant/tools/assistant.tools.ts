import { Tool, Type } from '@google/genai';

export const assistantTools: Tool = {
  functionDeclarations: [
    {
      name: 'search_recipes',
      description:
        'Use this function to search for recipes with semantic query and filters. CRITICAL: ALWAYS MAKE IT A PRIORITY TO USE FILTERS INSTEAD OF SEARCHING BY QUERY',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description:
              'Semantic search query (e.g., "chicken pasta"). CRITICAL: ALWAYS IN ENGLISH LANGUAGE',
          },
          isVegan: {
            type: Type.BOOLEAN,
            description: 'Filter for vegan recipes',
          },
          isVegetarian: {
            type: Type.BOOLEAN,
            description: 'Filter for vegetarian recipes',
          },
          isGluten_free: {
            type: Type.BOOLEAN,
            description: 'Filter for gluten-free recipes',
          },
          isHalal: {
            type: Type.BOOLEAN,
            description: 'Filter for halal recipes',
          },
          isKosher: {
            type: Type.BOOLEAN,
            description: 'Filter for kosher recipes',
          },
          isDairyFree: {
            type: Type.BOOLEAN,
            description: 'Filter for diary free recipes',
          },
          isNutFree: {
            type: Type.BOOLEAN,
            description: 'Filter for nut free recipes',
          },
          category: {
            type: Type.STRING,
            description:
              'Filter for recipe category: Meat Dishes, Poultry, Seafood, Soups & Stews, Pasta & Italian, Salads & Vegetables, Appetizers & Snacks, Breakfast & Brunch, Bakery & Breads, Cakes & Cupcakes, Cookies & Bars, Pies & Cobblers, Desserts & Sweets, Beverages, Mexican & Latin, Asian Cuisine, Sandwiches & Burgers, Casseroles & Comfort Food, World & Regional, Healthy & Dietary, Holidays & Events, Special Collections',
          },
          tastes: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description:
              'Filter for tastes: sweet, savory, sour, bitter, umami, spicy, neutral',
          },
          cuisineList: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description:
              'Filter for cuisine: african, american, asian, british, caribbean, chinese, european, filipino, french, german, greek, indian, italian, japanese, korean, latin american, mediterranean, mexican, middle eastern, middle eastern region, russian, spanish, thai, turkish, vietnamese, other',
          },
          difficulty: {
            type: Type.STRING,
            description: 'Difficulty level: easy, medium, hard',
          },
          cookSpeed: {
            type: Type.STRING,
            description: 'Cooking speed: fast, medium, slow',
          },
          maxCookTime: {
            type: Type.NUMBER,
            description: 'Maximum cooking time in minutes',
          },
          minRating: {
            type: Type.NUMBER,
            description: 'Minimum average rating from 0 to 5',
          },
          minHealthScore: {
            type: Type.NUMBER,
            description: 'Minimum healthiness score from 0 to 100',
          },
          limit: {
            type: Type.NUMBER,
            description: 'Number of recipes to return (default 10)',
          },
        },
      },
    },
    {
      name: 'get_recipe_details',
      description:
        'Use this function to remember full details about a specific recipe by its ID.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'The unique ID of the recipe' },
        },
        required: ['id'],
      },
    },
    {
      name: 'display_recipes',
      description: `Call this tool to present specific recipes (You also can show 1 recipe, then write some text and call this tool again to show another recipe) to the user as rich UI cards. CRITICAL: you must ALWAYS call this tool after search_recipes tool to show recipes which you recommend to the user. Prefer to recommend 3-5 recipes per call.`,
      parameters: {
        type: Type.OBJECT,
        properties: {
          recipeIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              'Array of exact recipe UUIDs to display (ALWAYS must come from search_recipes tool output).',
          },
        },
        required: ['recipeIds'],
      },
    },
    {
      name: 'get_site_documentation',
      description:
        'Retrieve platform documentation including site structure, routes, pages, access controls (middleware), and available user actions. Call this tool whenever the user asks about how to perform actions on the site, where to find specific pages/settings, or how to use a feature.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          format: {
            type: Type.STRING,
            description:
              'The format of documentation to retrieve: "markdown" (for detailed descriptions, page features, and AI instructions) or "json" (for structured route details and middleware). Defaults to "markdown".',
            enum: ['markdown', 'json'],
          },
        },
      },
    },
    {
      name: 'display_user_diets',
      description:
        'Call this tool to present the user\'s current dietary preferences (e.g. vegan, vegetarian, halal) as a rich interactive card in the chat UI. Call this when the user asks to see, change, check, or manage their dietary preferences.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    },
    {
      name: 'display_user_allergies',
      description:
        'Call this tool to present the user\'s current allergen/food restriction list (e.g. nuts, lactose, gluten) as a rich interactive card in the chat UI. Call this when the user asks to see, change, check, or manage their allergies or food restrictions.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    },
  ],
};
