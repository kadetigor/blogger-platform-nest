import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGameTables1763734690400 implements MigrationInterface {
    name = 'CreateGameTables1763734690400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create game_statuses enum
        await queryRunner.query(`
            CREATE TYPE "game_statuses_enum" AS ENUM('PendingSecondPlayer', 'Active', 'Finished')
        `);

        // Create answer_statuses enum
        await queryRunner.query(`
            CREATE TYPE "answer_statuses_enum" AS ENUM('Correct', 'Incorrect')
        `);

        // Create games table
        await queryRunner.query(`
            CREATE TABLE "games" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "first_player_id" uuid NOT NULL,
                "second_player_id" uuid,
                "questions_ids" text,
                "status" "game_statuses_enum" NOT NULL DEFAULT 'PendingSecondPlayer',
                "pair_created_at" TIMESTAMP NOT NULL,
                "game_start_date" TIMESTAMP,
                "game_finish_date" TIMESTAMP,
                "first_player_score" integer NOT NULL DEFAULT 0,
                "second_player_score" integer DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_games" PRIMARY KEY ("id")
            )
        `);

        // Create game_questions table (junction table)
        await queryRunner.query(`
            CREATE TABLE "game_questions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "order" integer NOT NULL,
                "game_id" uuid NOT NULL,
                "question_id" uuid NOT NULL,
                CONSTRAINT "PK_game_questions" PRIMARY KEY ("id")
            )
        `);

        // Create game_answers table
        await queryRunner.query(`
            CREATE TABLE "game_answers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "answer_number" integer NOT NULL,
                "answer_body" character varying NOT NULL,
                "answer_status" "answer_statuses_enum" NOT NULL,
                "added_at" TIMESTAMP NOT NULL DEFAULT now(),
                "game_id" uuid NOT NULL,
                "player_id" uuid NOT NULL,
                "question_id" uuid NOT NULL,
                CONSTRAINT "PK_game_answers" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints

        // games -> users (first_player_id)
        await queryRunner.query(`
            ALTER TABLE "games"
            ADD CONSTRAINT "FK_games_first_player"
            FOREIGN KEY ("first_player_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        `);

        // games -> users (second_player_id)
        await queryRunner.query(`
            ALTER TABLE "games"
            ADD CONSTRAINT "FK_games_second_player"
            FOREIGN KEY ("second_player_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        `);

        // game_questions -> games
        await queryRunner.query(`
            ALTER TABLE "game_questions"
            ADD CONSTRAINT "FK_game_questions_game"
            FOREIGN KEY ("game_id")
            REFERENCES "games"("id")
            ON DELETE CASCADE
        `);

        // game_questions -> quiz_question
        await queryRunner.query(`
            ALTER TABLE "game_questions"
            ADD CONSTRAINT "FK_game_questions_question"
            FOREIGN KEY ("question_id")
            REFERENCES "quiz_question"("id")
            ON DELETE CASCADE
        `);

        // game_answers -> games
        await queryRunner.query(`
            ALTER TABLE "game_answers"
            ADD CONSTRAINT "FK_game_answers_game"
            FOREIGN KEY ("game_id")
            REFERENCES "games"("id")
            ON DELETE CASCADE
        `);

        // game_answers -> users
        await queryRunner.query(`
            ALTER TABLE "game_answers"
            ADD CONSTRAINT "FK_game_answers_player"
            FOREIGN KEY ("player_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        `);

        // game_answers -> quiz_question
        await queryRunner.query(`
            ALTER TABLE "game_answers"
            ADD CONSTRAINT "FK_game_answers_question"
            FOREIGN KEY ("question_id")
            REFERENCES "quiz_question"("id")
            ON DELETE CASCADE
        `);

        // Add indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_games_first_player" ON "games" ("first_player_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_games_second_player" ON "games" ("second_player_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_games_status" ON "games" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_game_answers_game" ON "game_answers" ("game_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_game_answers_player" ON "game_answers" ("player_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_game_answers_player"`);
        await queryRunner.query(`DROP INDEX "IDX_game_answers_game"`);
        await queryRunner.query(`DROP INDEX "IDX_games_status"`);
        await queryRunner.query(`DROP INDEX "IDX_games_second_player"`);
        await queryRunner.query(`DROP INDEX "IDX_games_first_player"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "game_answers" DROP CONSTRAINT "FK_game_answers_question"`);
        await queryRunner.query(`ALTER TABLE "game_answers" DROP CONSTRAINT "FK_game_answers_player"`);
        await queryRunner.query(`ALTER TABLE "game_answers" DROP CONSTRAINT "FK_game_answers_game"`);
        await queryRunner.query(`ALTER TABLE "game_questions" DROP CONSTRAINT "FK_game_questions_question"`);
        await queryRunner.query(`ALTER TABLE "game_questions" DROP CONSTRAINT "FK_game_questions_game"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_games_second_player"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_games_first_player"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "game_answers"`);
        await queryRunner.query(`DROP TABLE "game_questions"`);
        await queryRunner.query(`DROP TABLE "games"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "answer_statuses_enum"`);
        await queryRunner.query(`DROP TYPE "game_statuses_enum"`);
    }
}