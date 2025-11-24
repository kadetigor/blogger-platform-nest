import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GameAnswer } from "../../domain/game-answer.entity";
import { Repository } from "typeorm";

@Injectable()
export class GameAnswerRepository {
    
    constructor(
        @InjectRepository(GameAnswer) private repository: Repository<GameAnswer>
    ) {}

    async saveAnswer(gameAnswer: GameAnswer): Promise<GameAnswer> {
        return this.repository.save(gameAnswer)
    }

    async findByGameAndPlayer(gameId: string, playerId: string): Promise<GameAnswer | null> {
        const result = await this.repository.findOne(
            {
                where: {
                    gameId: gameId,
                    playerId: playerId
                }
            }
        )

        return result
    }

    async countAnswers(gameId: string, playerId: string): Promise<number> {
        const count = await this.repository.count({
            where: {
                gameId: gameId,
                playerId: playerId
            }
        });

        return count;
    }

    async findByGame(gameId: string): Promise<GameAnswer[]> {
        const result = await this.repository.find({
            where: {
                gameId: gameId
            }
        })

        return result
    }
}