import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { QuizQuestion } from './domain/quiz-question.entity';
import { QuizQuestionRepository } from './infrastructure/quiz-question.repository';
import { PublishQuizQuestionDto } from './dto/publish-quiz-question.dto';

@Injectable()
export class QuizQuestionsService {

  constructor(
    private readonly quizQuestionRepository: QuizQuestionRepository,
  ){}

  async create(dto: CreateQuizQuestionDto): Promise<QuizQuestion> {
    const quizQuestion = await this.quizQuestionRepository.createQuizQuestion(dto)

    if (!quizQuestion) {
      throw new NotFoundException
    }

    return quizQuestion;
  }

  async remove(id: string): Promise<void> {
    return this.quizQuestionRepository.removeQuestion(id);
  }

  async updateQuestion(id: string, dto: UpdateQuizQuestionDto): Promise<boolean> {
    return await this.quizQuestionRepository.updateQuestion(id, dto);
  }

  async updateQuestionPublishStatus(id: string, dto: PublishQuizQuestionDto): Promise<boolean> {
    return await this.quizQuestionRepository.updateQuestionPublishStatus(id, dto);
  }
}
