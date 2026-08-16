import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipeCollections1777734505670 implements MigrationInterface {
  name = 'AddRecipeCollections1777734505670';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "recipe_collections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "isSystem" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_d3552c214a14bae1d49eb7afb69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5396e003e5463a5035ec78512d" ON "recipe_collections" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "recipe_collection_items" ("collectionId" uuid NOT NULL, "recipeId" uuid NOT NULL, CONSTRAINT "PK_508f4f22778151959ee5f9af246" PRIMARY KEY ("collectionId", "recipeId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5f7b2683c1209cc68cf250294" ON "recipe_collection_items" ("collectionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63b7a974f5838024e81f645888" ON "recipe_collection_items" ("recipeId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_collections" ADD CONSTRAINT "FK_5396e003e5463a5035ec78512d5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_collection_items" ADD CONSTRAINT "FK_b5f7b2683c1209cc68cf2502942" FOREIGN KEY ("collectionId") REFERENCES "recipe_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_collection_items" ADD CONSTRAINT "FK_63b7a974f5838024e81f6458889" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recipe_collection_items" DROP CONSTRAINT "FK_63b7a974f5838024e81f6458889"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_collection_items" DROP CONSTRAINT "FK_b5f7b2683c1209cc68cf2502942"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe_collections" DROP CONSTRAINT "FK_5396e003e5463a5035ec78512d5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63b7a974f5838024e81f645888"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5f7b2683c1209cc68cf250294"`,
    );
    await queryRunner.query(`DROP TABLE "recipe_collection_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5396e003e5463a5035ec78512d"`,
    );
    await queryRunner.query(`DROP TABLE "recipe_collections"`);
  }
}
