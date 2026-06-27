import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBankTransferModule1782507048439 implements MigrationInterface {
    name = 'AddBankTransferModule1782507048439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bank_transfer_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" character varying NOT NULL, "expectedAmount" numeric(10,2) NOT NULL, "foundAmount" numeric(10,2), "senderName" character varying, "description" text, "transactionId" character varying, "matchScore" integer NOT NULL DEFAULT '0', "scoreBreakdown" jsonb NOT NULL DEFAULT '{}', "result" character varying NOT NULL DEFAULT 'pending', "errorMessage" text, "provider" character varying NOT NULL DEFAULT 'mock', "checkedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f59fea96466ffd03dc83c8c541" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "matchedSenderName" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "matchedAmount" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "matchedAmount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "matchedSenderName"`);
        await queryRunner.query(`DROP TABLE "bank_transfer_logs"`);
    }

}
