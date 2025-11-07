import { QuizQuestion } from "../domain/quiz-question.entity";

export class QuizQuestionViewDto {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date | null;

  static mapToView(quizQuestion: QuizQuestion): QuizQuestionViewDto {
    const dto = new QuizQuestionViewDto();

    dto.id = quizQuestion.id;
    dto.body = quizQuestion.body;
    dto.correctAnswers = quizQuestion.correctAnswers;
    dto.published = quizQuestion.published;
    dto.createdAt = quizQuestion.createdAt;
    dto.updatedAt = quizQuestion.updatedAt;

    return dto;
  }
}