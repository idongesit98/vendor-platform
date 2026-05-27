import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779894464563 implements MigrationInterface {
    name = 'Migration1779894464563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_orders" ("id" SERIAL NOT NULL, "userId" uuid NOT NULL, "menuItemId" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "status" character varying NOT NULL DEFAULT 'pending', "orderedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_753da927c0c469cc6646133b213" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_30e8482d17959bb79ead70da22d" UNIQUE ("name"), CONSTRAINT "PK_124ae987900336f983881cb04e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "vendorId" character varying, "categoryId" uuid, "isAvailable" boolean NOT NULL DEFAULT false, "imageUrl" character varying, "prepTime" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_69bf08c96d8fada9f36f101216e" UNIQUE ("name"), CONSTRAINT "PK_57e6188f929e5dc6919168620c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "menu_items" ADD CONSTRAINT "FK_d56e5ccc298e8bf721f75a7eb96" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menu_items" DROP CONSTRAINT "FK_d56e5ccc298e8bf721f75a7eb96"`);
        await queryRunner.query(`DROP TABLE "menu_items"`);
        await queryRunner.query(`DROP TABLE "menu_categories"`);
        await queryRunner.query(`DROP TABLE "user_orders"`);
    }

}
