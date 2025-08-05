import { IsEnum, IsOptional } from "class-validator";
import { BaseQueryParams } from "src/core/dto/base.query-params.input-dto";
import { CommentsSortBy } from "./comments-sort-by";

export class GetCommentsQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsEnum(CommentsSortBy)
  sortBy = CommentsSortBy.CreatedAt;
}