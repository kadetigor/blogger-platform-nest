import { Module } from '@nestjs/common';
import { PairGameQuizController } from './api/pair-game-quiz.controller';
import { PairGameQuizService } from './application/pair-game-quiz.service';
import { UserAccountsModule } from '../../user-accounts/user-accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameQuestion } from './domain/game-question.entity';
import { PairGameQuiz } from './domain/pair-game-quiz.entity';
import { GameAnswer } from './domain/game-answer.entity';
import { PairGameQuizQueryRepository } from './infrastructure/query/pair-game-quiz.query-repository';
import { PairGameQuizRepository } from './infrastructure/pair-game-quiz.repository';
import { GameAnswerRepository } from './infrastructure/query/game-answer.repository';
import { QuizQuestionsModule } from '../quiz-questions/quiz-questions.module';
import { GameQuestionRepository } from './infrastructure/game-question.repository';

@Module({
  imports: [
    UserAccountsModule,
    QuizQuestionsModule,
    TypeOrmModule.forFeature([GameQuestion, PairGameQuiz, GameAnswer])
  ],
  controllers: [PairGameQuizController],
  providers: [
    PairGameQuizService,
    PairGameQuizRepository,
    PairGameQuizQueryRepository,
    GameAnswerRepository,
    GameQuestionRepository
  ],
})
export class PairGameQuizModule {}
