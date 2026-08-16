import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChatUpdatedSchema1779544702393 implements MigrationInterface {
  name = 'ChatUpdatedSchema1779544702393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chats" ADD "recipeId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_cdb739875f67fb58baebc6a6b42" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_cdb739875f67fb58baebc6a6b42"`,
    );
    await queryRunner.query(`ALTER TABLE "chats" DROP COLUMN "recipeId"`);
  }
}
