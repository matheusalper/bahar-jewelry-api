import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlog1782734290632 implements MigrationInterface {
    name = 'AddBlog1782734290632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`);
        await queryRunner.query(`CREATE TYPE "public"."blog_posts_status_enum" AS ENUM('draft', 'published', 'archived')`);
        await queryRunner.query(`CREATE TABLE "blog_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "excerpt" text, "content" text, "coverImage" character varying, "category" character varying, "tags" character varying, "status" "public"."blog_posts_status_enum" NOT NULL DEFAULT 'draft', "publishedAt" TIMESTAMP, "seoTitle" character varying, "seoDescription" text, "seoKeywords" character varying, "authorId" uuid, "viewCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5b2818a2c45c3edb9991b1c7a51" UNIQUE ("slug"), CONSTRAINT "PK_dd2add25eac93daefc93da9d387" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blog_posts" ADD CONSTRAINT "FK_09269227c7acf3cdf47ea4051e1" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_posts" DROP CONSTRAINT "FK_09269227c7acf3cdf47ea4051e1"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`);
        await queryRunner.query(`DROP TABLE "blog_posts"`);
        await queryRunner.query(`DROP TYPE "public"."blog_posts_status_enum"`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
