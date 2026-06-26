import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeBannerTitleOptional1782494613409 implements MigrationInterface {
    name = 'MakeBannerTitleOptional1782494613409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" ALTER COLUMN "title" SET DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" ALTER COLUMN "title" DROP DEFAULT`);
    }

}
