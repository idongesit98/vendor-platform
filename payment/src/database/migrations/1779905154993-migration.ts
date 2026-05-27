import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779905154993 implements MigrationInterface {
    name = 'Migration1779905154993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "webhook_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event" character varying NOT NULL, "reference" character varying NOT NULL, "payload" jsonb NOT NULL, "processed" boolean NOT NULL DEFAULT false, "errorMessage" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c41f6cdf59cdfe3704807650896" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_03c22578ebbd5b4b5d3ef48e64" ON "webhook_logs" ("event") `);
        await queryRunner.query(`CREATE TABLE "payment_outbox" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventType" character varying NOT NULL, "payload" jsonb NOT NULL, "processed" boolean NOT NULL DEFAULT false, "errorMessage" text, "attempts" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "processedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_70f409ce53496b180a03281be84" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_currency_enum" AS ENUM('NGN', 'USD')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'processing', 'success', 'failed', 'refund_pending', 'refunded')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_provider_enum" AS ENUM('paystack')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotencyKey" character varying NOT NULL, "orderId" character varying NOT NULL, "userId" character varying NOT NULL, "vendorId" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" "public"."payments_currency_enum" NOT NULL DEFAULT 'NGN', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "provider" "public"."payments_provider_enum" NOT NULL DEFAULT 'paystack', "providerReference" character varying, "providerTransactionId" character varying, "paymentUrl" character varying, "paidAt" TIMESTAMP, "failedAt" TIMESTAMP, "cancelledAt" TIMESTAMP, "failureReason" character varying, "providerResponse" json, "webhookPayload" jsonb, "retryCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_743b9fb1d2a059f2f7860418e4e" UNIQUE ("idempotencyKey"), CONSTRAINT "UQ_6bd9aa51f09e7dd2727adb8a6e6" UNIQUE ("providerReference"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_743b9fb1d2a059f2f7860418e4" ON "payments" ("idempotencyKey") `);
        await queryRunner.query(`CREATE INDEX "IDX_af929a5f2a400fdb6913b4967e" ON "payments" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6bd9aa51f09e7dd2727adb8a6e" ON "payments" ("providerReference") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6bd9aa51f09e7dd2727adb8a6e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af929a5f2a400fdb6913b4967e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_743b9fb1d2a059f2f7860418e4"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_currency_enum"`);
        await queryRunner.query(`DROP TABLE "payment_outbox"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_03c22578ebbd5b4b5d3ef48e64"`);
        await queryRunner.query(`DROP TABLE "webhook_logs"`);
    }

}
