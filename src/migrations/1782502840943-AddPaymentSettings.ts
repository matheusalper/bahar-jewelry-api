import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentSettings1782502840943 implements MigrationInterface {
    name = 'AddPaymentSettings1782502840943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site_settings" ADD "paymentSettings" jsonb NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN "paymentSettings"`);
    }

}
