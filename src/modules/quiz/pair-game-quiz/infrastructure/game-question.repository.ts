import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GameQuestion } from "../domain/game-question.entity";

@Injectable()
export class GameQuestionRepository {
    constructor(
        @InjectRepository(GameQuestion) private repository: Repository<GameQuestion>
    ) {}

    async createGameQuestions(gameId: string, questionIds: string[]): Promise<GameQuestion[]> {
        const gameQuestions = questionIds.map((questionId, index) => {
            return this.repository.create({
                game: { id: gameId } as any,
                question: { id: questionId } as any,
                order: index + 1
            });
        });

        return this.repository.save(gameQuestions);
    }
}
