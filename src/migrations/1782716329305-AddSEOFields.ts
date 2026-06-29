import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSEOFields1782716329305 implements MigrationInterface {
    name = 'AddSEOFields1782716329305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_product"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_user"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "seoTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "seoDescription" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD "seoKeywords" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "canonicalUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "ogTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "ogDescription" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD "ogImage" character varying`);
        await queryRunner.query(`ALTER TABLE "site_settings" ADD "seoSettings" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "site_settings" ADD "trackingCodes" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "site_settings" ADD "redirectRules" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_settings" ADD "robotsTxt" text`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."reviews_status_enum" AS ENUM('pending', 'approved', 'rejected', 'hidden')`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_a6b3c434392f5d10ec171043666" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_a6b3c434392f5d10ec171043666"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."reviews_status_enum"`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "status" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN "robotsTxt"`);
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN "redirectRules"`);
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN "trackingCodes"`);
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN "seoSettings"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "ogImage"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "ogDescription"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "ogTitle"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "canonicalUrl"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "seoKeywords"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "seoDescription"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "seoTitle"`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
