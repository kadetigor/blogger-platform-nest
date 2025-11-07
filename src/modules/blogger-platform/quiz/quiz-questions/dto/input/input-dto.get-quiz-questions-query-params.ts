import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BaseQueryParams } from 'src/core/dto/base.query-params.input-dto';
import { PublishedStatus } from '../published-status-enum';
import { QuizQuestionSortBy } from '../quiz-question-sort-by';


export class GetQuizQuestionsQueryParam extends BaseQueryParams {
  @IsOptional()
  @IsString()
  bodySerchTerm: string

  @IsOptional()
  @IsEnum(PublishedStatus)
  publishStatus: PublishedStatus = PublishedStatus.All

  @IsOptional()
  @IsEnum(QuizQuestionSortBy)
  sortBy: QuizQuestionSortBy = QuizQuestionSortBy.CreatedAt;
}