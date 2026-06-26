import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBannerTextOverlay1782494240787 implements MigrationInterface {
    name = 'AddBannerTextOverlay1782494240787'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" ADD "showTextOverlay" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "showTextOverlay"`);
    }

}
