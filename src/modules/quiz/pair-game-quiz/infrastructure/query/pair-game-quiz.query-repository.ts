import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PairGameQuiz } from "../../domain/pair-game-quiz.entity";
import { Not, Repository } from "typeorm";
import { GameStatuses } from "../../dto/enums/game-statuses.enum";

@Injectable()
export class QuizQueryRepository {
    constructor(
        @InjectRepository(PairGameQuiz) private repository: Repository<PairGameQuiz>
    ) {}

    async findCurrentGameByUserId(userId: string): Promise<PairGameQuiz | null> {
        const game = await this.repository.findOneBy({id: userId})
        return game
    }

    async findGameById(gameId: string, userId: string): Promise<PairGameQuiz | null> {
        const game = await this.repository.findOne({
            where: [
                { id: gameId, firstPlayerId: userId },
                { id: gameId, secondPlayerId: userId }   
            ]
        })

        return game
    }
    // TODO: find instead of create
    async findCurrentGame(firstPlayerId: string): Promise<PairGameQuiz> {
        const result = await this.repository.findBy({
            firstPlayerId: firstPlayerId,
        })

        return result[0];
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