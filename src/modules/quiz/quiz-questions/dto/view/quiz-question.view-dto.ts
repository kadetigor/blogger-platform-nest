import { QuizQuestion } from "../../domain/quiz-question.entity";
import { PublishedStatus } from "../published-status-enum";

export class QuizQuestionViewDto {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date | null;

  static mapToView(quizQuestion: QuizQuestion): QuizQuestionViewDto {
    return {
      id: quizQuestion.id,
      body: quizQuestion.body,
      correctAnswers: quizQuestion.correctAnswers,
      published: quizQuestion.publishedStatus === PublishedStatus.Published,
      createdAt: quizQuestion.createdAt,
      updatedAt: quizQuestion.updatedAt
    };
  }
}