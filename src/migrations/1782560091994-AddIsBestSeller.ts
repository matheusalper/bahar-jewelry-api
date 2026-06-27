import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsBestSeller1782560091994 implements MigrationInterface {
    name = 'AddIsBestSeller1782560091994'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "isBestSeller" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "isBestSeller"`);
    }

}
