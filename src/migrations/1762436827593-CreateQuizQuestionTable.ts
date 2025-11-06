import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuizQuestionTable1762436827593 implements MigrationInterface {
    name = 'CreateQuizQuestionTable1762436827593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for published_status
        await queryRunner.query(`
            CREATE TYPE "published_status_enum" AS ENUM('all', 'published', 'notPublished')
        `);

        // Create quiz_question table
        await queryRunner.query(`
            CREATE TABLE "quiz_question" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "body" character varying NOT NULL,
                "correct_answers" text NOT NULL,
                "published" boolean NOT NULL DEFAULT false,
                "published_status" "published_status_enum" NOT NULL DEFAULT 'notPublished',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now(),
                CONSTRAINT "PK_0bab74c2a71b9b3f8a941104083" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop quiz_question table
        await queryRunner.query(`DROP TABLE "quiz_question"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE "published_status_enum"`);
    }

}
