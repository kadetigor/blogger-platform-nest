import { Module } from '@nestjs/common';
import { QuizQuestionsService } from './quiz-questions.service';
import { QuizQuestionsController } from './quiz-questions.controller';
import { QuizQuestion } from './entities/quiz-question.entity';
import { PairGameQuiz } from '../pair-game-quiz/entities/pair-game-quiz.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizQuestionRepository } from './infrastructure/quiz-question.repository';
import { QuizQuestionsQueryRepository } from './infrastructure/query/quiz-question.query-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizQuestion, PairGameQuiz])
  ],
  controllers: [QuizQuestionsController],
  providers: [QuizQuestionsService, QuizQuestionRepository, QuizQuestionsQueryRepository],
})
export class QuizQuestionsModule {}
