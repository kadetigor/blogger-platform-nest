import { Injectable } from '@nestjs/common';
import { CreatePairGameQuizDto } from './dto/create-pair-game-quiz.dto';
import { UpdatePairGameQuizDto } from './dto/update-pair-game-quiz.dto';

@Injectable()
export class PairGameQuizService {
  create(createPairGameQuizDto: CreatePairGameQuizDto) {
    return 'This action adds a new pairGameQuiz';
  }

  findAll() {
    return `This action returns all pairGameQuiz`;
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
