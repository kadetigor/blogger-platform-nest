import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PairGameQuiz } from "../domain/pair-game-quiz.entity";
import { Not, Repository } from "typeorm";
import { GameStatuses } from "../dto/enums/game-statuses.enum";
import { GameQuestionRepository } from "./game-question.repository";

@Injectable()
export class PairGameQuizRepository {

    constructor(
        @InjectRepository(PairGameQuiz) private repository: Repository<PairGameQuiz>,
        private gameQuestionRepository: GameQuestionRepository
    ) {}

    async save(pairGameQuiz: PairGameQuiz): Promise<PairGameQuiz> {
        return this.repository.save(pairGameQuiz);
    }

    async addSecondPlayer(gameId: string, playerId: string, questionIds: string[]): Promise<boolean> {
        const result = await this.repository.update(
            gameId,
            {
                secondPlayerId: playerId,
                questionsIds: questionIds
            }
        )

        if (result.affected === 0) {
            throw new NotFoundException('Could not add Second player');
        }

        // Create GameQuestion records for the relationship
        await this.gameQuestionRepository.createGameQuestions(gameId, questionIds);

        return true;
    }

    async updateGameStatus(gameId: string, status: GameStatuses): Promise<boolean> {
        const result = await this.repository.update(
            gameId,
            {
                status: status,
            }
        )

        if (result.affected === 0) {
            throw new NotFoundException('Could not update the Game Status');
        }
        return true;
    }

    async updateScores(gameId: string, firstPlayerScore: number, secondPlayerScore:number): Promise<boolean> {
        const result = await this.repository.update(
            gameId,
            {
                firstPlayerScore: firstPlayerScore,
                secondPlayerScore: secondPlayerScore,
            }
        )

        if (result.affected === 0) {
            throw new NotFoundException('Could not update players score')
        }

        return true;
    }
}