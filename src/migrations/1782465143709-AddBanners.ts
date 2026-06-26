import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBanners1782465143709 implements MigrationInterface {
    name = 'AddBanners1782465143709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "banners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "subtitle" character varying, "description" text, "button1Text" character varying, "button1Link" character varying, "button2Text" character varying, "button2Link" character varying, "desktopImage" character varying, "tabletImage" character varying, "mobileImage" character varying, "sortOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "startDate" date, "endDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e9b186b959296fcb940790d31c3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "banners"`);
    }

}
