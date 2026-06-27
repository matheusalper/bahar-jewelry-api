import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBaharParaSystem1782543226511 implements MigrationInterface {
    name = 'AddBaharParaSystem1782543226511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bahar_para_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "orderId" character varying, "type" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "description" text, "expiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_aff3467c04a0c86178ebf5dbc20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "baharParaBalance" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "cartSubtotal" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "baharParaUsed" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "cashPayableAmount" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "baharParaEarnRate" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "baharParaEarnBaseAmount" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "baharParaEarned" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "isFirstPaidOrder" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "baharParaAppliedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "baharParaEarnedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "site_settings" ADD "baharParaSettings" jsonb NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN "baharParaSettings"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "baharParaEarnedAt"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "baharParaAppliedAt"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "isFirstPaidOrder"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "baharParaEarned"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "baharParaEarnBaseAmount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "baharParaEarnRate"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cashPayableAmount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "baharParaUsed"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cartSubtotal"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "baharParaBalance"`);
        await queryRunner.query(`DROP TABLE "bahar_para_transactions"`);
    }

}
