import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviewsSystem1782566058523 implements MigrationInterface {
    name = 'AddReviewsSystem1782566058523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "ratingAverage" numeric(3,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "ratingCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "ratingBreakdown" jsonb NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "ratingBreakdown"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "ratingCount"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "ratingAverage"`);
    }

}
