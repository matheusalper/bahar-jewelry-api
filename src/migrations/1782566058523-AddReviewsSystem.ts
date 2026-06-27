import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewsSystem1782566058523 implements MigrationInterface {
  name = 'AddReviewsSystem1782566058523';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Reviews tablosunu oluştur (yoksa)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
        "orderId"           VARCHAR,
        "rating"            INTEGER NOT NULL,
        "title"             VARCHAR,
        "comment"           TEXT,
        "images"            JSONB NOT NULL DEFAULT '[]',
        "status"            VARCHAR NOT NULL DEFAULT 'pending',
        "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
        "approvedAt"        TIMESTAMP,
        "approvedBy"        VARCHAR,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "productId"         UUID NOT NULL,
        "userId"            UUID NOT NULL,
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_user"    FOREIGN KEY ("userId")    REFERENCES "users"("id")    ON DELETE CASCADE
      )
    `);

    // 2. Products tablosuna rating kolonlarını ekle (varsa atla)
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN IF NOT EXISTS "ratingAverage"   NUMERIC(3,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "ratingCount"     INTEGER      NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "ratingBreakdown" JSONB        NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "ratingBreakdown"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "ratingCount"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "ratingAverage"`);
  }
}
