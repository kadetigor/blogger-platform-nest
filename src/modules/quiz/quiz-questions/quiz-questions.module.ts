import { Module } from '@nestjs/common';
import { QuizQuestion } from './domain/quiz-question.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizQuestionRepository } from './infrastructure/quiz-question.repository';
import { QuizQuestionsQueryRepository } from './infrastructure/query/quiz-question.query-repository';
import { QuizQuestionsController } from './api/quiz-questions.controller';
import { QuizQuestionsService } from './application/quiz-questions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizQuestion])
  ],
  controllers: [QuizQuestionsController],
  providers: [QuizQuestionsService, QuizQuestionRepository, QuizQuestionsQueryRepository],
  exports: [QuizQuestionRepository],
})
export class QuizQuestionsModule {}
