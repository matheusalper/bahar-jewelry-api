import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBannerFitMode1782477132493 implements MigrationInterface {
    name = 'AddBannerFitMode1782477132493'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" ADD "fitMode" character varying NOT NULL DEFAULT 'contain'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "fitMode"`);
    }

}
