import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PairGameQuiz } from "../../domain/pair-game-quiz.entity";
import { Not, Repository, In } from "typeorm";
import { GameStatuses } from "../../dto/enums/game-statuses.enum";

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
}