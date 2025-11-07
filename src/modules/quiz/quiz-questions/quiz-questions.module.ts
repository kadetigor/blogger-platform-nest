import { Module } from '@nestjs/common';
import { QuizQuestion } from './domain/quiz-question.entity';
import { PairGameQuiz } from '../pair-game-quiz/entities/pair-game-quiz.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizQuestionRepository } from './infrastructure/quiz-question.repository';
import { QuizQuestionsQueryRepository } from './infrastructure/query/quiz-question.query-repository';
import { QuizQuestionsController } from './api/quiz-questions.controller';
import { QuizQuestionsService } from './application/quiz-questions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizQuestion, PairGameQuiz])
  ],
  controllers: [QuizQuestionsController],
  providers: [QuizQuestionsService, QuizQuestionRepository, QuizQuestionsQueryRepository],
})
export class QuizQuestionsModule {}
