import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRecipeEnums1786544087862 implements MigrationInterface {
    name = 'UpdateRecipeEnums1786544087862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."recipes_category_enum" RENAME TO "recipes_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."recipes_category_enum" AS ENUM('Breakfast & Brunch', 'Appetizers & Starters', 'Soups & Stews', 'Salads', 'Poultry', 'Meat', 'Seafood', 'Side Dishes', 'Snacks', 'Breads & Bakery', 'Desserts', 'Beverages', 'Sauces & Dressings', 'Drinks')`);
        await queryRunner.query(`ALTER TABLE "recipes" ALTER COLUMN "category" TYPE "public"."recipes_category_enum" USING "category"::"text"::"public"."recipes_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recipes_category_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."recipes_cuisinelist_enum" RENAME TO "recipes_cuisinelist_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."recipes_cuisinelist_enum" AS ENUM('american', 'british', 'chinese', 'french', 'georgian', 'german', 'greek', 'indian', 'italian', 'japanese', 'korean', 'mexican', 'polish', 'spanish', 'thai', 'turkish', 'ukrainian', 'vietnamese', 'other')`);
        await queryRunner.query(`ALTER TABLE "recipes" ALTER COLUMN "cuisineList" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recipes" ALTER COLUMN "cuisineList" TYPE "public"."recipes_cuisinelist_enum"[] USING "cuisineList"::"text"::"public"."recipes_cuisinelist_enum"[]`);
        await queryRunner.query(`ALTER TABLE "recipes" ALTER COLUMN "cuisineList" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TYPE "public"."recipes_cuisinelist_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."recipes_cuisinelist_enum_old" AS ENUM('african', 'american', 'asian', 'british', 'caribbean', 'chinese', 'european', 'filipino', 'french', 'german', 'greek', 'indian', 'italian', 'japanese', 'korean', 'latin american', 'mediterranean', 'mexican', 'middle eastern', 'middle eastern region', 'russian', 'spanish', 'thai', 'turkish', 'vietnamese', 'other')`);
        await queryRunner.query(`ALTER TABLE "recipes" ALTER COLUMN "cuisineList" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recipes" ALTER COLUMN "cuisineList" TYPE "public"."recipes_cuisinelist_enum_old"[] USING "cuisineList"::"text"::"public"."recipes_cuisinelist_enum_old"[]`);
        await queryRunner.query(`ALTER TABLE "recipes" ALTER COLUMN "cuisineList" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TYPE "public"."recipes_cuisinelist_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."recipes_cuisinelist_enum_old" RENAME TO "recipes_cuisinelist_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."recipes_category_enum_old" AS ENUM('Meat Dishes', 'Poultry', 'Seafood', 'Soups & Stews', 'Pasta & Italian', 'Salads & Vegetables', 'Appetizers & Snacks', 'Breakfast & Brunch', 'Bakery & Breads', 'Cakes & Cupcakes', 'Cookies & Bars', 'Pies & Cobblers', 'Desserts & Sweets', 'Beverages', 'Mexican & Latin', 'Asian Cuisine', 'Sandwiches & Burgers', 'Casseroles & Comfort Food', 'World & Regional', 'Healthy & Dietary', 'Holidays & Events', 'Special Collections')`);
        await queryRunner.query(`ALTER TABLE "recipes" ALTER COLUMN "category" TYPE "public"."recipes_category_enum_old" USING "category"::"text"::"public"."recipes_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."recipes_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."recipes_category_enum_old" RENAME TO "recipes_category_enum"`);
    }

}
