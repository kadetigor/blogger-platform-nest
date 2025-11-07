import { Module } from '@nestjs/common';
import { PairGameQuizService } from './pair-game-quiz.service';
import { PairGameQuizController } from './pair-game-quiz.controller';

@Module({
  controllers: [PairGameQuizController],
  providers: [PairGameQuizService],
})
export class PairGameQuizModule {}
