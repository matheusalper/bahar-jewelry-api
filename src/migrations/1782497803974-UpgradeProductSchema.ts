import { MigrationInterface, QueryRunner } from "typeorm";

export class UpgradeProductSchema1782497803974 implements MigrationInterface {
    name = 'UpgradeProductSchema1782497803974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "shortDescription" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD "salePrice" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "sku" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "products" ADD "isFeatured" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "products" ADD "isNew" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "products" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);

        // Mevcut "images" (text[]) verisini kaybetmeden yeni jsonb yapisina tasi:
        // her URL -> { url, alt: baslik, order: index, isMain: index===0 }
        await queryRunner.query(`ALTER TABLE "products" ADD "imagesNew" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`
          UPDATE "products" p
          SET "imagesNew" = COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'url', u,
                'alt', p.title,
                'order', idx - 1,
                'isMain', idx = 1
              )
            )
            FROM unnest(p.images) WITH ORDINALITY AS t(u, idx)
          ), '[]'::jsonb)
          WHERE p.images IS NOT NULL AND array_length(p.images, 1) > 0
        `);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "images"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "imagesNew" TO "images"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "images" TO "imagesOld"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "images" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`
          UPDATE "products" p
          SET "images" = COALESCE((
            SELECT array_agg(elem->>'url' ORDER BY (elem->>'order')::int)
            FROM jsonb_array_elements(p."imagesOld") AS elem
          ), '{}')
        `);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "imagesOld"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "isNew"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "isFeatured"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sku"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "salePrice"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "shortDescription"`);
    }

}
