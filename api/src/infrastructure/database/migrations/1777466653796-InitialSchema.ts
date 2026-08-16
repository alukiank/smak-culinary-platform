import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1777466653796 implements MigrationInterface {
  name = 'InitialSchema1777466653796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "recipe_vectors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "embedding" vector(768), "recipeId" uuid, CONSTRAINT "REL_5197ca3c048a0f149b2cc65f45" UNIQUE ("recipeId"), CONSTRAINT "PK_745280bd59943cc5ca04498409c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recipe_review_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "reviewId" uuid, CONSTRAINT "PK_9d15c98c0059ced666494686408" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recipe_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" integer NOT NULL, "text" text, "imageId" text, "commentsCount" integer NOT NULL DEFAULT '0', "isPublished" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "recipeId" uuid, CONSTRAINT "UQ_USER_RECIPE_REVIEW" UNIQUE ("userId", "recipeId"), CONSTRAINT "CHK_a53a94d29926ccd64e9acd03cb" CHECK ("rating" >= 1 AND "rating" <= 5), CONSTRAINT "PK_0fc886960e280e23f8c91c4cb3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recipes_category_enum" AS ENUM('Meat Dishes', 'Poultry', 'Seafood', 'Soups & Stews', 'Pasta & Italian', 'Salads & Vegetables', 'Appetizers & Snacks', 'Breakfast & Brunch', 'Bakery & Breads', 'Cakes & Cupcakes', 'Cookies & Bars', 'Pies & Cobblers', 'Desserts & Sweets', 'Beverages', 'Mexican & Latin', 'Asian Cuisine', 'Sandwiches & Burgers', 'Casseroles & Comfort Food', 'World & Regional', 'Healthy & Dietary', 'Holidays & Events', 'Special Collections')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recipes_cookspeed_enum" AS ENUM('fast', 'medium', 'slow')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recipes_difficulty_enum" AS ENUM('easy', 'medium', 'hard')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recipes_cuisinelist_enum" AS ENUM('african', 'american', 'asian', 'british', 'caribbean', 'chinese', 'european', 'filipino', 'french', 'german', 'greek', 'indian', 'italian', 'japanese', 'korean', 'latin american', 'mediterranean', 'mexican', 'middle eastern', 'middle eastern region', 'russian', 'spanish', 'thai', 'turkish', 'vietnamese', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recipes_tastes_enum" AS ENUM('bitter', 'neutral', 'savory', 'sour', 'spicy', 'sweet', 'umami')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recipes_status_enum" AS ENUM('public', 'draft', 'archived', 'rejected', 'premoderation', 'moderation')`,
    );
    await queryRunner.query(
      `CREATE TABLE "recipes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "category" "public"."recipes_category_enum" NOT NULL, "description" text, "ingredients" text array NOT NULL DEFAULT '{}', "directions" text array NOT NULL DEFAULT '{}', "cookSpeed" "public"."recipes_cookspeed_enum" NOT NULL DEFAULT 'medium', "prepTime" integer, "cookTime" integer, "difficulty" "public"."recipes_difficulty_enum" NOT NULL DEFAULT 'medium', "cuisineList" "public"."recipes_cuisinelist_enum" array NOT NULL DEFAULT '{}', "tastes" "public"."recipes_tastes_enum" array NOT NULL DEFAULT '{}', "isVegan" boolean NOT NULL DEFAULT false, "isVegetarian" boolean NOT NULL DEFAULT false, "isGluten_free" boolean NOT NULL DEFAULT false, "isHalal" boolean NOT NULL DEFAULT false, "isKosher" boolean NOT NULL DEFAULT false, "isDairyFree" boolean NOT NULL DEFAULT false, "isNutFree" boolean NOT NULL DEFAULT false, "healthScore" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."recipes_status_enum" NOT NULL DEFAULT 'draft', "rating" double precision, "numRatings" integer, "coverImageId" text, "galleryImageIds" text array NOT NULL DEFAULT '{}', "youtubeVideoUrl" text, "userId" uuid, CONSTRAINT "CHK_ce8c09e1beed06e0c4561dd9ce" CHECK ("rating" <= 5 AND "rating" >= 0), CONSTRAINT "CHK_5e0f0382883302c9d57d9456a1" CHECK ("healthScore" <= 100 AND "healthScore" >= 0), CONSTRAINT "PK_8f09680a51bf3669c1598a21682" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aebbaa1cd38e2e5996d5847753" ON "recipes" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1de479f3244a0ff6b473d4602b" ON "recipes" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e7da0aa83a7c8b533ca06ef31" ON "recipes" ("isVegan") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b44234302cea697e6aef50b4cd" ON "recipes" ("isVegetarian") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2160d0d87998ca697d24516f8d" ON "recipes" ("isGluten_free") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0cffd0ded1b0e128c89d36f38d" ON "recipes" ("isHalal") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1b018f7b0438825abb47d8f978" ON "recipes" ("isKosher") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef4deaaafa429a4071edb5623b" ON "recipes" ("isDairyFree") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e081567ebe8c3f153b9bd78a9f" ON "recipes" ("isNutFree") `,
    );

    // --- Додані GIN індекси ---
    await queryRunner.query(
      `CREATE INDEX "idx_recipes_cuisune_search_gin" ON "recipes" USING GIN ("cuisineList")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recipes_tastes_search_gin" ON "recipes" USING GIN ("tastes")`,
    );
    // --------------------------

    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_plantype_enum" AS ENUM('FREE', 'PRO', 'PREMIUM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "planType" "public"."subscriptions_plantype_enum" NOT NULL DEFAULT 'FREE', "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE', "currentPeriodEnd" TIMESTAMP, "userId" uuid NOT NULL, CONSTRAINT "REL_fbdba4e2ac694cf8c9cecf4dc8" UNIQUE ("userId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_currency_enum" AS ENUM('UAH', 'USD', 'EUR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" integer NOT NULL, "currency" "public"."payments_currency_enum" NOT NULL DEFAULT 'UAH', "externalTransactionData" jsonb, "externalTransactionId" character varying, "userId" uuid, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(255) NOT NULL, "displayname" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "dietary" text array DEFAULT '{}', "allergies" text array DEFAULT '{}', "isBanned" boolean NOT NULL DEFAULT false, "isVerified" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recipe_review_moderation_logs_decision_enum" AS ENUM('approved', 'rejected', 'flagged')`,
    );
    await queryRunner.query(
      `CREATE TABLE "recipe_review_moderation_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "decision" "public"."recipe_review_moderation_logs_decision_enum" NOT NULL, "reason" text, "aiConfidenceScore" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "reviewId" uuid, "adminId" uuid, CONSTRAINT "PK_432cac3fc018300b3a009bd389c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recipe_moderation_logs_decision_enum" AS ENUM('approved', 'rejected', 'flagged')`,
    );
    await queryRunner.query(
      `CREATE TABLE "recipe_moderation_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "decision" "public"."recipe_moderation_logs_decision_enum" NOT NULL, "reason" text, "aiConfidenceScore" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "recipeId" uuid, "adminId" uuid, CONSTRAINT "CHK_f1a53b646462a824c37ec0cf5c" CHECK ("aiConfidenceScore" >= 0 AND "aiConfidenceScore" <= 1), CONSTRAINT "PK_dc3fbbee369f4f41dc528fd5232" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "summary" text, "messageCount" integer NOT NULL DEFAULT '0', "isArchived" boolean NOT NULL DEFAULT false, "userId" uuid, CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_role_enum" AS ENUM('user', 'model')`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."messages_role_enum" NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "chatId" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_vectors" ADD CONSTRAINT "FK_5197ca3c048a0f149b2cc65f459" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_review_comments" ADD CONSTRAINT "FK_4a951cd28fac97049bb025ad832" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_review_comments" ADD CONSTRAINT "FK_c6365df264b1c9a040de9e798b3" FOREIGN KEY ("reviewId") REFERENCES "recipe_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_reviews" ADD CONSTRAINT "FK_c489c19d40b611994e2a80e2581" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_reviews" ADD CONSTRAINT "FK_de48954f5461f74121b3910b88f" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipes" ADD CONSTRAINT "FK_ad4f881e4b9769d16c0ed2bb3f0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_review_moderation_logs" ADD CONSTRAINT "FK_7095d181107445490143b05c0be" FOREIGN KEY ("reviewId") REFERENCES "recipe_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_review_moderation_logs" ADD CONSTRAINT "FK_6039850fc7d8e5caeeb2e4fa022" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_moderation_logs" ADD CONSTRAINT "FK_f60c3df90ba2f29d92b9d33a18e" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_moderation_logs" ADD CONSTRAINT "FK_7c83d3262391ef3425527cd9f56" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_ae8951c0a763a060593606b7e2d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_36bc604c820bb9adc4c75cd4115" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_36bc604c820bb9adc4c75cd4115"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_ae8951c0a763a060593606b7e2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_moderation_logs" DROP CONSTRAINT "FK_7c83d3262391ef3425527cd9f56"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_moderation_logs" DROP CONSTRAINT "FK_f60c3df90ba2f29d92b9d33a18e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_review_moderation_logs" DROP CONSTRAINT "FK_6039850fc7d8e5caeeb2e4fa022"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_review_moderation_logs" DROP CONSTRAINT "FK_7095d181107445490143b05c0be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipes" DROP CONSTRAINT "FK_ad4f881e4b9769d16c0ed2bb3f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_reviews" DROP CONSTRAINT "FK_de48954f5461f74121b3910b88f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_reviews" DROP CONSTRAINT "FK_c489c19d40b611994e2a80e2581"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_review_comments" DROP CONSTRAINT "FK_c6365df264b1c9a040de9e798b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_review_comments" DROP CONSTRAINT "FK_4a951cd28fac97049bb025ad832"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_vectors" DROP CONSTRAINT "FK_5197ca3c048a0f149b2cc65f459"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TYPE "public"."messages_role_enum"`);
    await queryRunner.query(`DROP TABLE "chats"`);
    await queryRunner.query(`DROP TABLE "recipe_moderation_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."recipe_moderation_logs_decision_enum"`,
    );
    await queryRunner.query(`DROP TABLE "recipe_review_moderation_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."recipe_review_moderation_logs_decision_enum"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_currency_enum"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_plantype_enum"`);

    // --- Видалення GIN індексів ---
    await queryRunner.query(
      `DROP INDEX "public"."idx_recipes_tastes_search_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_recipes_cuisune_search_gin"`,
    );
    // ------------------------------

    await queryRunner.query(
      `DROP INDEX "public"."IDX_e081567ebe8c3f153b9bd78a9f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef4deaaafa429a4071edb5623b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1b018f7b0438825abb47d8f978"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0cffd0ded1b0e128c89d36f38d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2160d0d87998ca697d24516f8d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b44234302cea697e6aef50b4cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8e7da0aa83a7c8b533ca06ef31"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1de479f3244a0ff6b473d4602b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aebbaa1cd38e2e5996d5847753"`,
    );
    await queryRunner.query(`DROP TABLE "recipes"`);
    await queryRunner.query(`DROP TYPE "public"."recipes_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recipes_tastes_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recipes_cuisinelist_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recipes_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recipes_cookspeed_enum"`);
    await queryRunner.query(`DROP TYPE "public"."recipes_category_enum"`);
    await queryRunner.query(`DROP TABLE "recipe_reviews"`);
    await queryRunner.query(`DROP TABLE "recipe_review_comments"`);
    await queryRunner.query(`DROP TABLE "recipe_vectors"`);
  }
}
