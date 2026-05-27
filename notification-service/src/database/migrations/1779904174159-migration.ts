import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779904174159 implements MigrationInterface {
    name = 'Migration1779904174159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_recipienttype_enum" AS ENUM('user', 'vendor')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('user.registered', 'user.verified', 'user.otp.resent', 'order_created', 'order_confirmed', 'order_preparing', 'order_ready', 'order_delivered', 'order_cancelled', 'payment_initiated', 'payment_completed', 'payment_failed', 'vendor.registered', 'vendor_verified', 'vendor.otp.resent')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_channel_enum" AS ENUM('email', 'in_app', 'push')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_status_enum" AS ENUM('pending', 'sent', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recipientId" character varying NOT NULL, "correlationId" character varying NOT NULL, "recipientType" "public"."notification_recipienttype_enum" NOT NULL, "type" "public"."notification_type_enum" NOT NULL, "channel" "public"."notification_channel_enum" NOT NULL, "status" "public"."notification_status_enum" NOT NULL DEFAULT 'pending', "title" character varying NOT NULL, "message" text NOT NULL, "metadata" jsonb, "readtAt" TIMESTAMP, "isRead" boolean NOT NULL DEFAULT false, "errorMessage" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_notification" UNIQUE ("recipientId", "type", "channel", "correlationId"), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TYPE "public"."notification_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_recipienttype_enum"`);
    }

}
