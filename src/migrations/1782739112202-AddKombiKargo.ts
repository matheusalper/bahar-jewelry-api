import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKombiKargo1782739112202 implements MigrationInterface {
    name = 'AddKombiKargo1782739112202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "relatedProductIds" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "trackingNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "trackingUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "cargoCompany" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cargoCompany"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "trackingUrl"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "trackingNumber"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "relatedProductIds"`);
    }

}
