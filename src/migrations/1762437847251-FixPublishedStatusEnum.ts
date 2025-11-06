import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPublishedStatusEnum1762437847251 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for published_status
        await queryRunner.query(`
            CREATE TYPE "published_status_enum" AS ENUM('all', 'published', 'notPublished')
        `);

        // Add a temporary column
        await queryRunner.query(`
            ALTER TABLE "quiz_question" ADD COLUMN "published_status_temp" "published_status_enum" DEFAULT 'notPublished'
        `);

        // Drop the old integer column
        await queryRunner.query(`
            ALTER TABLE "quiz_question" DROP COLUMN "published_status"
        `);

        // Rename the temp column to published_status
        await queryRunner.query(`
            ALTER TABLE "quiz_question" RENAME COLUMN "published_status_temp" TO "published_status"
        `);

        // Set NOT NULL constraint
        await queryRunner.query(`
            ALTER TABLE "quiz_question" ALTER COLUMN "published_status" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Convert back to integer
        await queryRunner.query(`
            ALTER TABLE "quiz_question" ALTER COLUMN "published_status" DROP NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "quiz_question" ADD COLUMN "published_status_temp" integer
        `);

        await queryRunner.query(`
            ALTER TABLE "quiz_question" DROP COLUMN "published_status"
        `);

        await queryRunner.query(`
            ALTER TABLE "quiz_question" RENAME COLUMN "published_status_temp" TO "published_status"
        `);

        await queryRunner.query(`
            DROP TYPE "published_status_enum"
        `);
    }

}
