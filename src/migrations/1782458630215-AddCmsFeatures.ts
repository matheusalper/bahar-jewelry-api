import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCmsFeatures1782458630215 implements MigrationInterface {
    name = 'AddCmsFeatures1782458630215'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "site_settings" ("id" integer NOT NULL DEFAULT '1', "banner" jsonb NOT NULL DEFAULT '{}', "announcementBar" jsonb NOT NULL DEFAULT '[]', "socialLinks" jsonb NOT NULL DEFAULT '{}', "contactInfo" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_e4290e8371a166d7e066d131f6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "badge" character varying, "buttonText" character varying, "buttonLink" character varying, "icon" character varying, "membersOnly" boolean NOT NULL DEFAULT true, "isActive" boolean NOT NULL DEFAULT true, "startDate" date, "endDate" date, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "slug" character varying`);
        // Var olan kategori satırları için slug değerini geriye dönük doldur
        await queryRunner.query(`
            UPDATE "categories" SET "slug" = CASE "name"
                WHEN 'Kolye' THEN 'kolye'
                WHEN 'Küpe' THEN 'kupe'
                WHEN 'Bilezik' THEN 'bilezik'
                WHEN 'Yüzük' THEN 'yuzuk'
                WHEN 'Set' THEN 'set'
                WHEN 'Saç & Bijuteri' THEN 'sac-bijuteri'
                WHEN 'Halhal' THEN 'halhal'
                ELSE lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
            END
            WHERE "slug" IS NULL
        `);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "slug" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "image" character varying`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "showInMenu" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "showOnHomepage" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "sortOrder" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "sortOrder"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "showOnHomepage"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "showInMenu"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "image"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "slug"`);
        await queryRunner.query(`DROP TABLE "campaigns"`);
        await queryRunner.query(`DROP TABLE "site_settings"`);
    }

}
