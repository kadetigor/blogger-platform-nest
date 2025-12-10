import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinishDeadlineToGames1765368897915 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games"
            ADD COLUMN "finish_deadline" TIMESTAMP NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "games"
            DROP COLUMN "finish_deadline"
        `);
    }

}
