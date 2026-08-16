/**
 * Dataset Importer Script
 *
 * Imports recipes from dataset/recipes.json into the application database.
 * - Prompts for dataset file and images folder paths (defaults to D:\smak-dataset\dataset)
 * - Allows selecting an existing Admin user or creating a new Admin user
 * - Uploads recipe cover images to Cloudinary
 * - Sets ratings and numRatings to 0
 * - Generates AI vector embeddings for semantic search (pgvector)
 *
 * Usage: npm run import:dataset
 *   OR: npx ts-node -r tsconfig-paths/register scripts/import-dataset.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import * as argon2 from 'argon2';
import { GoogleGenAI } from '@google/genai';
import dataSource from '../typeorm.config';
import { Recipe } from '../src/recipe/entities/recipe.entity';
import { User } from '../src/user/entities/user.entity';
import { RecipeVector } from '../src/recipe/entities/recipe-vector.entity';
import { UserRoleEnum } from '../src/user/enums/user-role.enum';
import { RecipeStatusEnum } from '../src/recipe/enums/recipe-status.enum';

dotenv.config();

// ─── Readline Helper ─────────────────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string, defaultValue?: string): Promise<string> {
  const promptText = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed ? trimmed : (defaultValue || ''));
    });
  });
}

// ─── Main Process ────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(65));
  console.log('  SMAK Catalog — Dataset Importer');
  console.log('═'.repeat(65) + '\n');

  // 1. Path Configuration (Auto-detects across all drives C-G, Linux VPS, Docker, or relative paths)
  const drives = ['C', 'D', 'E', 'F', 'G'];
  const candidateFiles: string[] = [];

  for (const drive of drives) {
    candidateFiles.push(`${drive}:\\smak-dataset\\dataset\\recipes.json`);
    candidateFiles.push(`${drive}:\\smak-dataset\\recipes.json`);
  }
  candidateFiles.push(
    '/smak-dataset/recipes.json',
    '/smak-dataset/dataset/recipes.json',
    path.join(process.cwd(), 'dataset', 'recipes.json'),
    path.join(process.cwd(), '..', 'smak-dataset', 'dataset', 'recipes.json'),
    path.join(process.cwd(), '..', 'smak-dataset', 'recipes.json'),
  );

  let detectedRecipesFile = '';
  for (const candidate of candidateFiles) {
    if (fs.existsSync(candidate)) {
      detectedRecipesFile = candidate;
      break;
    }
  }

  const candidateImageDirs: string[] = [];
  for (const drive of drives) {
    candidateImageDirs.push(`${drive}:\\smak-dataset\\dataset\\images`);
    candidateImageDirs.push(`${drive}:\\smak-dataset\\images`);
  }
  candidateImageDirs.push(
    '/smak-dataset/images',
    '/smak-dataset/dataset/images',
    path.join(process.cwd(), 'dataset', 'images'),
    path.join(process.cwd(), '..', 'smak-dataset', 'dataset', 'images'),
    path.join(process.cwd(), '..', 'smak-dataset', 'images'),
  );

  let detectedImagesDir = '';
  for (const candidate of candidateImageDirs) {
    if (fs.existsSync(candidate)) {
      detectedImagesDir = candidate;
      break;
    }
  }

  const defaultRecipesFile = detectedRecipesFile || path.join(process.cwd(), 'dataset', 'recipes.json');
  const defaultImagesDir = detectedImagesDir || path.join(process.cwd(), 'dataset', 'images');

  let recipesFilePath = defaultRecipesFile;
  let imagesDirPath = defaultImagesDir;

  if (detectedRecipesFile && detectedImagesDir) {
    console.log(`Auto-detected Dataset: ${detectedRecipesFile}`);
    console.log(`Auto-detected Images:  ${detectedImagesDir}\n`);
    console.log('Path Selection:');
    console.log('  [1] Use auto-detected paths (Default)');
    console.log('  [2] Enter custom paths manually');

    const pathChoice = await ask('\nYour choice', '1');

    if (pathChoice === '2') {
      recipesFilePath = await ask('Enter path to dataset JSON file', defaultRecipesFile);
      recipesFilePath = path.resolve(recipesFilePath.replace(/^["']|["']$/g, ''));

      while (!fs.existsSync(recipesFilePath)) {
        console.log(`[ERROR] File not found at path: ${recipesFilePath}`);
        recipesFilePath = await ask('Enter valid path to dataset JSON file');
        recipesFilePath = path.resolve(recipesFilePath.replace(/^["']|["']$/g, ''));
      }

      imagesDirPath = await ask('Enter path to images directory', defaultImagesDir);
      imagesDirPath = path.resolve(imagesDirPath.replace(/^["']|["']$/g, ''));

      while (!fs.existsSync(imagesDirPath)) {
        console.log(`[ERROR] Directory not found at path: ${imagesDirPath}`);
        imagesDirPath = await ask('Enter valid path to images directory');
        imagesDirPath = path.resolve(imagesDirPath.replace(/^["']|["']$/g, ''));
      }
    }
  } else {
    recipesFilePath = await ask('Enter path to dataset JSON file', defaultRecipesFile);
    recipesFilePath = path.resolve(recipesFilePath.replace(/^["']|["']$/g, ''));

    while (!fs.existsSync(recipesFilePath)) {
      console.log(`[ERROR] File not found at path: ${recipesFilePath}`);
      recipesFilePath = await ask('Enter valid path to dataset JSON file');
      recipesFilePath = path.resolve(recipesFilePath.replace(/^["']|["']$/g, ''));
    }

    imagesDirPath = await ask('Enter path to images directory', defaultImagesDir);
    imagesDirPath = path.resolve(imagesDirPath.replace(/^["']|["']$/g, ''));

    while (!fs.existsSync(imagesDirPath)) {
      console.log(`[ERROR] Directory not found at path: ${imagesDirPath}`);
      imagesDirPath = await ask('Enter valid path to images directory');
      imagesDirPath = path.resolve(imagesDirPath.replace(/^["']|["']$/g, ''));
    }
  }

  console.log(`\nDataset path selected: ${recipesFilePath}`);
  console.log(`Images folder selected: ${imagesDirPath}\n`);

  // 2. Initialize Database Connection
  console.log('Connecting to database...');
  await dataSource.initialize();
  console.log('Database successfully connected!\n');

  const userRepository = dataSource.getRepository(User);
  const recipeRepository = dataSource.getRepository(Recipe);
  const vectorRepository = dataSource.getRepository(RecipeVector);

  // 3. Admin Account Selection / Creation
  const existingAdmins = await userRepository.find({
    where: { role: UserRoleEnum.ADMIN },
  });

  let selectedAdmin: User;

  console.log('Select an Admin account to own the imported recipes:');
  if (existingAdmins.length > 0) {
    existingAdmins.forEach((admin, idx) => {
      console.log(`  [${idx + 1}] ${admin.email} (${admin.username}) - ${admin.displayname}`);
    });
    console.log(`  [+] Create a new Admin account`);

    const choice = await ask('\nYour choice (number or "+")', '1');

    if (choice === '+' || parseInt(choice) > existingAdmins.length || parseInt(choice) < 1) {
      selectedAdmin = await createNewAdmin(userRepository);
    } else {
      const idx = parseInt(choice) - 1;
      selectedAdmin = existingAdmins[idx];
    }
  } else {
    console.log('[INFO] No existing Admin accounts found in database.');
    selectedAdmin = await createNewAdmin(userRepository);
  }

  console.log(`\nSelected recipe owner: ${selectedAdmin.email} (ID: ${selectedAdmin.id})\n`);

  // 4. Configure Services (Cloudinary & Google AI)
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('[ERROR] Cloudinary environment variables are missing in .env!');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('[ERROR] GEMINI_API_KEY is missing in .env!');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const embeddingModel = process.env.EMBEDDING_MODEL_NAME || 'gemini-embedding-001';

  // 5. Read Recipes Dataset
  const rawRecipes = JSON.parse(fs.readFileSync(recipesFilePath, 'utf-8'));
  console.log(`Loaded ${rawRecipes.length} recipes from JSON file.`);
  const confirmRun = await ask('Start importing into database? (y/n)', 'y');

  if (confirmRun.toLowerCase() !== 'y') {
    console.log('Import cancelled.');
    rl.close();
    await dataSource.destroy();
    process.exit(0);
  }

  console.log('\nStarting recipe import...\n');

  let successCount = 0;
  let imageUploadCount = 0;
  let vectorCount = 0;

  for (let i = 0; i < rawRecipes.length; i++) {
    const raw = rawRecipes[i];
    const num = i + 1;
    console.log(`[${num}/${rawRecipes.length}] Processing: "${raw.title}"...`);

    let cloudinaryPublicId: string | null = null;

    // Upload cover image to Cloudinary if image file exists
    if (raw.coverImageId) {
      const localImagePath = path.join(imagesDirPath, raw.coverImageId);
      if (fs.existsSync(localImagePath)) {
        try {
          const uploadRes = await cloudinary.uploader.upload(localImagePath, {
            folder: 'recipes',
            resource_type: 'image',
          });
          cloudinaryPublicId = uploadRes.public_id;
          imageUploadCount++;
          console.log(`   Cloudinary: uploaded -> ${cloudinaryPublicId}`);
        } catch (err: any) {
          console.error(`   [WARNING] Cloudinary upload error for "${raw.coverImageId}": ${err.message}`);
        }
      } else {
        console.log(`   [WARNING] Local image file not found: ${raw.coverImageId}`);
      }
    }

    // Prepare Recipe Entity
    const recipe = recipeRepository.create({
      title: raw.title,
      category: raw.category,
      description: raw.description,
      ingredients: raw.ingredients || [],
      directions: raw.directions || [],
      cookSpeed: raw.cookSpeed || 'medium',
      prepTime: raw.prepTime || 15,
      cookTime: raw.cookTime || 30,
      difficulty: raw.difficulty || 'medium',
      cuisineList: raw.cuisineList || [],
      tastes: raw.tastes || [],
      isVegan: raw.isVegan || false,
      isVegetarian: raw.isVegetarian || false,
      isGluten_free: raw.isGluten_free || false,
      isHalal: raw.isHalal || false,
      isKosher: raw.isKosher || false,
      isDairyFree: raw.isDairyFree || false,
      isNutFree: raw.isNutFree || false,
      healthScore: raw.healthScore || 50,
      status: RecipeStatusEnum.PUBLIC,
      rating: 0,
      numRatings: 0,
      coverImageId: cloudinaryPublicId,
      galleryImageIds: [],
      youtubeVideoUrl: null,
      user: selectedAdmin,
    });

    const savedRecipe = await recipeRepository.save(recipe);
    successCount++;

    // Generate AI Vector Embedding for Semantic Search
    try {
      const ingredientsText = (savedRecipe.ingredients || []).join(', ');
      const textToEmbed = `${savedRecipe.title}. ${savedRecipe.description || ''}. Ingredients: ${ingredientsText}`;

      const response = await ai.models.embedContent({
        model: embeddingModel,
        contents: [{ parts: [{ text: textToEmbed }] }],
        config: {
          taskType: 'RETRIEVAL_DOCUMENT' as any,
          outputDimensionality: 768,
          title: savedRecipe.title,
        },
      });

      const embeddingValues = response.embeddings?.[0]?.values;

      if (embeddingValues && embeddingValues.length > 0) {
        const recipeVector = vectorRepository.create({
          recipe: savedRecipe,
          embedding: embeddingValues,
        });
        await vectorRepository.save(recipeVector);
        vectorCount++;
        console.log(`   Vector Indexing: indexed successfully (${embeddingValues.length} dimensions)`);
      }
    } catch (err: any) {
      console.error(`   [WARNING] Vector indexing error for "${savedRecipe.title}": ${err.message}`);
    }

    // Small delay between items to avoid Cloudinary/Gemini rate limits
    await new Promise(r => setTimeout(r, 150));
  }

  // 6. Final Summary
  console.log('\n' + '═'.repeat(65));
  console.log('  DATASET IMPORT COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(65));
  console.log(`   Total recipes saved: ${successCount}/${rawRecipes.length}`);
  console.log(`   Uploaded photos to Cloudinary: ${imageUploadCount}`);
  console.log(`   Generated and saved AI vectors: ${vectorCount}`);
  console.log(`   Recipe owner: ${selectedAdmin.email}`);
  console.log(`   Recipe status: PUBLIC`);
  console.log(`   Ratings & Review count: 0`);

  rl.close();
  await dataSource.destroy();
  process.exit(0);
}

// ─── Helper: Create Admin User ───────────────────────────────────────────────

async function createNewAdmin(userRepository: any): Promise<User> {
  console.log('\nCreate new Admin account:');
  const email = await ask('Email', 'admin@smak.ua');
  const username = await ask('Username', 'admin');
  const displayname = await ask('Display Name', 'Admin');
  const password = await ask('Password', 'Admin123!');

  const passwordHash = await argon2.hash(password);

  const newUser = userRepository.create({
    email,
    username,
    displayname,
    passwordHash,
    role: UserRoleEnum.ADMIN,
    isVerified: true,
    isBanned: false,
    dietary: [],
    allergies: [],
  });

  const savedUser = await userRepository.save(newUser);
  console.log(`[SUCCESS] Admin account ${savedUser.email} created successfully!`);
  return savedUser;
}

main().catch((err) => {
  console.error('\n[ERROR] Fatal error during import:', err);
  rl.close();
  process.exit(1);
});
