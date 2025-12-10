import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PairGameQuiz } from "../../domain/pair-game-quiz.entity";
import { Not, Repository, In } from "typeorm";
import { GameStatuses } from "../../dto/enums/game-statuses.enum";
import { GetAllMyGamesQueryParams } from "../../dto/input/get-all-users-games.input-query-params";
import { SortDirection } from "src/core/dto/base.query-params.input-dto";
import { MyStatisticViewModel } from "../../dto/view/my-statistic.view-dto";
import { GetTopPlayersQueryParams } from "../../dto/input/get-top-players.input-query-params";

@Injectable()
export class PairGameQuizQueryRepository {
    constructor(
        @InjectRepository(PairGameQuiz) private repository: Repository<PairGameQuiz>
    ) {}

    async findCurrentGameByUserId(userId: string): Promise<PairGameQuiz | null> {
        const game = await this.repository.findOne({
            where: [
                { firstPlayerId: userId, status: In([GameStatuses.Active, GameStatuses.PendingSecondPlayer]) },
                { secondPlayerId: userId, status: GameStatuses.Active }
            ],
            relations: ['gameQuestions', 'gameQuestions.question', 'gameAnswers']
        });
        return game;
    }

    async findGameById(gameId: string): Promise<PairGameQuiz | null> {
        const game = await this.repository.findOne({
            where: { id: gameId },
            relations: ['gameQuestions', 'gameQuestions.question', 'gameAnswers']
        });

        return game;
    }

    async findPendingGame(excludeUserId: string): Promise<PairGameQuiz | null> {
        const game = await this.repository.findOne({
            where: { 
                status: GameStatuses.PendingSecondPlayer,
                firstPlayerId: Not(excludeUserId)  // Don't match with yourself
            },
            order: { 
                pairCreatedAt: 'ASC'  // Oldest first (FIFO queue)
            }
        });
        return game;
    }

    async findAllMyGames(
        query: GetAllMyGamesQueryParams,
        userId: string
    ): Promise<{ items: PairGameQuiz[]; totalCount: number; page: number; pageSize: number; pagesCount: number }> {
        const skip = query.calculateSkip();
        const limit = query.pageSize;

        let orderBycolumn: keyof PairGameQuiz = 'pairCreatedAt'
        switch (query.sortBy) {
            case 'status':
                orderBycolumn = 'status'
                break
            case 'pairCreatedDate':
            default:
                orderBycolumn = 'pairCreatedAt'
        }

        const [games, totalCount] = await this.repository.findAndCount({
            where: [
                { firstPlayerId: userId },
                { secondPlayerId: userId }
            ],
            relations: ['gameQuestions', 'gameQuestions.question', 'gameAnswers'],
            order: {
                [orderBycolumn]: query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC',
                pairCreatedAt: 'DESC' // Secondary sort by creation date descending
            },
            skip,
            take: limit
        });

        return {
            items: games,
            totalCount,
            page: query.pageNumber,
            pageSize: query.pageSize,
            pagesCount: Math.ceil(totalCount / query.pageSize)
        }
    }


    async findMyStatistics(userId: string): Promise<MyStatisticViewModel> {
        const result = await this.repository
            .createQueryBuilder('game')
            .select([
                'COUNT(*) as gamesCount',
                `SUM(
                    CASE
                        WHEN "game"."first_player_id" = :userId THEN "game"."first_player_score"
                        ELSE "game"."second_player_score"
                    END
                ) as sumScore`,
                `AVG(
                    CASE
                        WHEN "game"."first_player_id" = :userId THEN "game"."first_player_score"
                        ELSE "game"."second_player_score"
                    END
                ) as avgScores`,
                `SUM(
                    CASE
                        WHEN "game"."first_player_id" = :userId AND "game"."first_player_score" > "game"."second_player_score" THEN 1
                        WHEN "game"."second_player_id" = :userId AND "game"."second_player_score" > "game"."first_player_score" THEN 1
                        ELSE 0
                    END
                ) as winsCount`,
                `SUM(
                    CASE
                        WHEN "game"."first_player_id" = :userId AND "game"."first_player_score" < "game"."second_player_score" THEN 1
                        WHEN "game"."second_player_id" = :userId AND "game"."second_player_score" < "game"."first_player_score" THEN 1
                        ELSE 0
                    END
                ) as lossesCount`,
                `SUM(
                    CASE
                        WHEN "game"."first_player_score" = "game"."second_player_score" THEN 1
                        ELSE 0
                    END
                ) as drawsCount`
            ])
            .where('("game"."first_player_id" = :userId OR "game"."second_player_id" = :userId)')
            .andWhere('"game"."status" = :finished')
            .setParameters({ userId, finished: GameStatuses.Finished })
            .getRawOne();

        // Handle case when user has no games
        // Note: PostgreSQL returns lowercase column names
        const gamesCount = result?.gamescount ? Number(result.gamescount) : 0;
        if (!result || gamesCount === 0) {
            return {
                sumScore: 0,
                avgScores: 0,
                gamesCount: 0,
                winsCount: 0,
                lossesCount: 0,
                drawsCount: 0
            };
        }

        const avgScore = parseFloat(result.avgscores || '0');

        return {
            sumScore: Number(result.sumscore || 0),
            avgScores: Math.round(avgScore * 100) / 100,
            gamesCount: Number(result.gamescount || 0),
            winsCount: Number(result.winscount || 0),
            lossesCount: Number(result.lossescount || 0),
            drawsCount: Number(result.drawscount || 0)
        };
    }

    async findTopPlayers(query: GetTopPlayersQueryParams): Promise<{
        items: Array<{
            playerId: string;
            sumScore: number;
            avgScores: number;
            gamesCount: number;
            winsCount: number;
            lossesCount: number;
            drawsCount: number;
        }>;
        totalCount: number;
    }> {
        const skip = query.calculateSkip();
        const limit = query.pageSize;

        // Parse sort criteria
        const sortCriteria = query.getParsedSortCriteria();

        // Build ORDER BY clause
        const orderByClause = sortCriteria
            .map(criterion => `${criterion.field.toLowerCase()} ${criterion.direction}`)
            .join(', ');

        // Build the query using raw SQL for better control
        const countQuery = `
            SELECT COUNT(DISTINCT player_id) as total
            FROM (
                SELECT "game"."first_player_id" as player_id
                FROM "games" "game"
                WHERE "game"."status" = $1 AND "game"."deleted_at" IS NULL

                UNION

                SELECT "game"."second_player_id" as player_id
                FROM "games" "game"
                WHERE "game"."status" = $1 AND "game"."deleted_at" IS NULL
            ) as all_players
        `;

        const dataQuery = `
            SELECT
                player_games.player_id as playerId,
                COUNT(*)::int as gamesCount,
                COALESCE(SUM(player_games.player_score), 0)::int as sumScore,
                COALESCE(ROUND(AVG(player_games.player_score)::numeric, 2), 0) as avgScores,
                COALESCE(SUM(player_games.is_win), 0)::int as winsCount,
                COALESCE(SUM(player_games.is_loss), 0)::int as lossesCount,
                COALESCE(SUM(player_games.is_draw), 0)::int as drawsCount
            FROM (
                SELECT
                    "game"."first_player_id" as player_id,
                    "game"."first_player_score" as player_score,
                    CASE WHEN "game"."first_player_score" > "game"."second_player_score" THEN 1 ELSE 0 END as is_win,
                    CASE WHEN "game"."first_player_score" < "game"."second_player_score" THEN 1 ELSE 0 END as is_loss,
                    CASE WHEN "game"."first_player_score" = "game"."second_player_score" THEN 1 ELSE 0 END as is_draw
                FROM "games" "game"
                WHERE "game"."status" = $1 AND "game"."deleted_at" IS NULL

                UNION ALL

                SELECT
                    "game"."second_player_id" as player_id,
                    "game"."second_player_score" as player_score,
                    CASE WHEN "game"."second_player_score" > "game"."first_player_score" THEN 1 ELSE 0 END as is_win,
                    CASE WHEN "game"."second_player_score" < "game"."first_player_score" THEN 1 ELSE 0 END as is_loss,
                    CASE WHEN "game"."second_player_score" = "game"."first_player_score" THEN 1 ELSE 0 END as is_draw
                FROM "games" "game"
                WHERE "game"."status" = $1 AND "game"."deleted_at" IS NULL
            ) as player_games
            GROUP BY player_games.player_id
            ORDER BY ${orderByClause}
            LIMIT $2 OFFSET $3
        `;

        // Execute queries
        const [countResult, results] = await Promise.all([
            this.repository.manager.query(countQuery, [GameStatuses.Finished]),
            this.repository.manager.query(dataQuery, [GameStatuses.Finished, limit, skip])
        ]);

        const totalCount = parseInt(countResult[0]?.total || '0', 10);

        // Map results to proper types
        const items = results.map((result: any) => ({
            playerId: result.playerid,
            sumScore: Number(result.sumscore || 0),
            avgScores: Number(result.avgscores || 0),
            gamesCount: Number(result.gamescount || 0),
            winsCount: Number(result.winscount || 0),
            lossesCount: Number(result.lossescount || 0),
            drawsCount: Number(result.drawscount || 0)
        }));

        return {
            items,
            totalCount
        };
    }
}