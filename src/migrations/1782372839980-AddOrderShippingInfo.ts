import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderShippingInfo1782372839980 implements MigrationInterface {
    name = 'AddOrderShippingInfo1782372839980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "customerEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingAddress" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingAddress"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customerEmail"`);
    }

}
