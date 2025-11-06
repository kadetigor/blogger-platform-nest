import { Module } from '@nestjs/common';
import { QuizQuestionsModule } from './quiz-questions/quiz-questions.module';
import { PairGameQuizModule } from './pair-game-quiz/pair-game-quiz.module';

@Module({
  imports: [QuizQuestionsModule, PairGameQuizModule],
  controllers: [],
  providers: [],
})
export class QuizModule {}
