import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779892217277 implements MigrationInterface {
    name = 'Migration1779892217277'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'vendor', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying, "phoneNumber" character varying, "address" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer', "isActive" boolean NOT NULL DEFAULT true, "isEmailVerified" boolean NOT NULL DEFAULT false, "otpStatusSent" boolean DEFAULT false, "emailVerificationOtp" character varying, "otpExpiryTime" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_39d1221f0ea9f526ac3e9a850ea" UNIQUE ("emailVerificationOtp"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" numeric(2,1) NOT NULL, "comment" character varying, "rejectionReason" text, "userId" uuid NOT NULL, "vendorId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."vendors_role_enum" AS ENUM('customer', 'vendor', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."vendors_applicationstatus_enum" AS ENUM('pending', 'verified', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "vendors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."vendors_role_enum" NOT NULL DEFAULT 'vendor', "isEmailVerified" boolean NOT NULL DEFAULT false, "phone" character varying, "address" character varying, "description" character varying NOT NULL, "otpStatusSent" boolean NOT NULL DEFAULT false, "emailVerificationOtp" character varying, "otpExpiryTime" TIMESTAMP, "applicationStatus" "public"."vendors_applicationstatus_enum" NOT NULL DEFAULT 'pending', "rejectionReason" text, "isActive" boolean, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3fe1343dbf2a7d9b7be1c27725a" UNIQUE ("email"), CONSTRAINT "UQ_c41a5f417a2d1846902983e4535" UNIQUE ("emailVerificationOtp"), CONSTRAINT "PK_9c956c9797edfae5c6ddacc4e6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_12a0f887b44bb8a6107c02dbb08" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_12a0f887b44bb8a6107c02dbb08"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"`);
        await queryRunner.query(`DROP TABLE "vendors"`);
        await queryRunner.query(`DROP TYPE "public"."vendors_applicationstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."vendors_role_enum"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
