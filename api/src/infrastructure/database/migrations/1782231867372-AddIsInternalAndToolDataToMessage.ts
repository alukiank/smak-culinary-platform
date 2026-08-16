import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsInternalAndToolDataToMessage1782231867372 implements MigrationInterface {
    name = 'AddIsInternalAndToolDataToMessage1782231867372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "isInternal" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "toolData" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "toolData"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "isInternal"`);
    }

}
