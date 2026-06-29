import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSEOFields1782716329305 implements MigrationInterface {
    name = 'AddSEOFields1782716329305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SEO alanları — products tablosu
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seoTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seoDescription" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seoKeywords" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "canonicalUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ogTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ogDescription" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ogImage" character varying`);

        // SEO alanları — site_settings tablosu
        await queryRunner.query(`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "seoSettings" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "trackingCodes" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "redirectRules" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "robotsTxt" text`);

        // reviews.status — varchar olarak kalabilir, enum dönüşümü gerekmiyor
        // (TypeORM entity'de enum tanımlı olsa da DB'de varchar çalışır)
        // FK constraint — sadece yoksa ekle
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_a6b3c434392f5d10ec171043666'
                ) THEN
                    ALTER TABLE "reviews" ADD CONSTRAINT "FK_a6b3c434392f5d10ec171043666"
                    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;
                END IF;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_7ed5659e7139fc8bc039198cc1f'
                ) THEN
                    ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"
                    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
                END IF;
            END $$
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "ogImage"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "ogDescription"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "ogTitle"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "canonicalUrl"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "seoKeywords"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "seoDescription"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "seoTitle"`);
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "robotsTxt"`);
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "redirectRules"`);
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "trackingCodes"`);
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "seoSettings"`);
    }
}
