import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGuestCheckoutSupport1782402936887 implements MigrationInterface {
    name = 'AddGuestCheckoutSupport1782402936887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_customertype_enum" AS ENUM('guest', 'registered')`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "customerType" "public"."orders_customertype_enum" NOT NULL DEFAULT 'registered'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "customerName" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "customerPhone" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "district" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "note" text`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "district"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customerPhone"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customerName"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customerType"`);
        await queryRunner.query(`DROP TYPE "public"."orders_customertype_enum"`);
    }

}
