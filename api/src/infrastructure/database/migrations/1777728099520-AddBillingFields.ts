import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingFields1777728099520 implements MigrationInterface {
  name = 'AddBillingFields1777728099520';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "liqpayOrderId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILURE', 'REVERSED', 'ERROR')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "orderId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "UQ_af929a5f2a400fdb6913b4967e1" UNIQUE ("orderId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."subscriptions_status_enum" RENAME TO "subscriptions_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum" USING "status"::"text"::"public"."subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscriptions_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum_old" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum_old" USING "status"::"text"::"public"."subscriptions_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."subscriptions_status_enum_old" RENAME TO "subscriptions_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "UQ_af929a5f2a400fdb6913b4967e1"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "orderId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "liqpayOrderId"`,
    );
  }
}
