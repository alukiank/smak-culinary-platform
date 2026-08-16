import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecipeSchemaUpdate1777479876502 implements MigrationInterface {
  name = 'RecipeSchemaUpdate1777479876502';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recipe_reviews" ALTER COLUMN "isPublished" SET DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recipe_reviews" ALTER COLUMN "isPublished" SET DEFAULT false`,
    );
  }
}
