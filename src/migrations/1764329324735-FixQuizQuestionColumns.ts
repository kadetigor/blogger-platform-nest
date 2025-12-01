import { MigrationInterface, QueryRunner } from "typeorm";

export class FixQuizQuestionColumns1764329324735 implements MigrationInterface {
    name = 'FixQuizQuestionColumns1764329324735'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the published boolean column (we only use publishedStatus enum)
        await queryRunner.query(`ALTER TABLE "quiz_question" DROP COLUMN IF EXISTS "published"`);

        // Convert simple-array format to JSON array
        // First create a temporary column
        await queryRunner.query(`ALTER TABLE "quiz_question" ADD COLUMN "correct_answers_temp" json`);

        // Convert comma-separated string to JSON array
        await queryRunner.query(`
            UPDATE "quiz_question"
            SET "correct_answers_temp" =
                CASE
                    WHEN "correct_answers" = '' THEN '[]'::json
                    ELSE to_json(string_to_array("correct_answers", ','))
                END
        `);

        // Drop old column and rename new one
        await queryRunner.query(`ALTER TABLE "quiz_question" DROP COLUMN "correct_answers"`);
        await queryRunner.query(`ALTER TABLE "quiz_question" RENAME COLUMN "correct_answers_temp" TO "correct_answers"`);
        await queryRunner.query(`ALTER TABLE "quiz_question" ALTER COLUMN "correct_answers" SET NOT NULL`);

        // Fix updated_at to have no default (should be null on create)
        await queryRunner.query(`ALTER TABLE "quiz_question" ALTER COLUMN "updated_at" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert questions_ids rename
        await queryRunner.query(`ALTER TABLE "games" RENAME COLUMN "questions_ids" TO "questionsIds"`);

        // Revert updated_at default
        await queryRunner.query(`ALTER TABLE "quiz_question" ALTER COLUMN "updated_at" SET DEFAULT now()`);

        // Revert correct_answers to text
        await queryRunner.query(`ALTER TABLE "quiz_question" ALTER COLUMN "correct_answers" TYPE text`);

        // Re-add published column
        await queryRunner.query(`ALTER TABLE "quiz_question" ADD "published" boolean NOT NULL DEFAULT false`);
    }
}