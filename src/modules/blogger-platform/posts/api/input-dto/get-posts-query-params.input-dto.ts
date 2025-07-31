import { BaseQueryParams } from 'src/core/dto/base.query-params.input-dto';
import { PostsSortBy } from './posts-sort-by';
import { IsOptional, IsEnum } from 'class-validator';

export class GetPostsQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsEnum(PostsSortBy)
  sortBy = PostsSortBy.CreatedAt;
}
