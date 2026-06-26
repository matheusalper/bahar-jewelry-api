import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBannerImageVariants1782475157519 implements MigrationInterface {
    name = 'AddBannerImageVariants1782475157519'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" ADD "originalImage" character varying`);
        await queryRunner.query(`ALTER TABLE "banners" ADD "thumbnailImage" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "thumbnailImage"`);
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "originalImage"`);
    }

}
