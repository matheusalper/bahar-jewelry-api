import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMembershipFeatures1782499897892 implements MigrationInterface {
    name = 'AddMembershipFeatures1782499897892'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "label" character varying NOT NULL DEFAULT 'Adresim', "fullName" character varying NOT NULL, "phone" character varying NOT NULL, "city" character varying NOT NULL, "district" character varying NOT NULL, "addressLine" text NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "productTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "productImage" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "paymentMethod" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentstatus_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "paymentStatus" "public"."orders_paymentstatus_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TYPE "public"."orders_status_enum" RENAME TO "orders_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'preparing', 'shipped', 'delivered', 'cancelled', 'paid')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::"text"::"public"."orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum_old"`);

        // VERİ TAŞIMA: eskiden "status='paid'" hem siparişin alındığını hem ödendiğini ifade ediyordu.
        // Artık bu ikisi ayrı: status -> "Yeni Sipariş" (pending), paymentStatus -> "Ödendi" (paid).
        await queryRunner.query(`UPDATE "orders" SET "paymentStatus" = 'paid', "status" = 'pending' WHERE "status" = 'paid'`);
        // Kargoya verilmiş/teslim edilmiş bir siparişin ödenmemiş olması mantıksız, bu yüzden onlar da "paid" sayılır.
        await queryRunner.query(`UPDATE "orders" SET "paymentStatus" = 'paid' WHERE "status" = 'shipped'`);

        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_95c93a584de49f0b0e13f753630" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_95c93a584de49f0b0e13f753630"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum_old" AS ENUM('pending', 'paid', 'shipped', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum_old" USING "status"::"text"::"public"."orders_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."orders_status_enum_old" RENAME TO "orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "paymentStatus"`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "paymentMethod"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "productImage"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "productTitle"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
    }

}
