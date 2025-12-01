import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryParams } from 'src/core/dto/base.query-params.input-dto';
import { PublishedStatus } from '../published-status-enum';
import { QuizQuestionSortBy } from '../quiz-question-sort-by';


export class GetQuizQuestionsQueryParam extends BaseQueryParams {
  @IsOptional()
  @IsString()
  bodySearchTerm?: string | null = null

  @Transform(({ value }) => value || PublishedStatus.All)
  @IsOptional()
  @IsEnum(PublishedStatus)
  publishedStatus: PublishedStatus = PublishedStatus.All

  @Transform(({ value }) => value || QuizQuestionSortBy.CreatedAt)
  @IsOptional()
  @IsEnum(QuizQuestionSortBy)
  sortBy: QuizQuestionSortBy = QuizQuestionSortBy.CreatedAt;
}