import { Injectable } from '@nestjs/common';
import { CreatePairGameQuizDto } from '../dto/create-pair-game-quiz.dto';
import { UpdatePairGameQuizDto } from '../dto/update-pair-game-quiz.dto';
import { UsersExternalQueryRepository } from 'src/modules/user-accounts/infrastructure/external-query/users.external-query-repository';
import { GameViewDto } from '../dto/view/game.view-dto';
import { QuizQueryRepository } from '../infrastructure/query/pair-game-quiz.query-repository';


@Injectable()
export class PairGameQuizService {

  constructor(
    private readonly userQueryRepository: UsersExternalQueryRepository,
    private readonly gameQueryRepository: QuizQueryRepository,
  ) {}

  create(createPairGameQuizDto: CreatePairGameQuizDto) {
    return;
  }

  async getCurrentGame(userId: string): Promise<GameViewDto> {

    const user = await this.userQueryRepository.findById(userId);
    
    const userLogin = user?.login

    const result = await this.gameQueryRepository.findCurrentGameByUserId(userId);

    return result;
  }

  findOne(id: number) {
    return `This action returns a #${id} pairGameQuiz`;
  }

  update(id: number, updatePairGameQuizDto: UpdatePairGameQuizDto) {
    return `This action updates a #${id} pairGameQuiz`;
  }

  remove(id: number) {
    return `This action removes a #${id} pairGameQuiz`;
  }
}
