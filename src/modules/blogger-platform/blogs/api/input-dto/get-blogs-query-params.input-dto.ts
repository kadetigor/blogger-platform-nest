import { BaseQueryParams } from 'src/core/dto/base.query-params.input-dto';
import { BlogsSortBy } from './blogs-sort-by';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class GetBlogsQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsEnum(BlogsSortBy)
  sortBy = BlogsSortBy.CreatedAt;

  @IsOptional()
  @IsString()
  searchNameTerm: string | null = null;

  @IsOptional()
  @IsString()
  searchDescriptionTerm: string | null = null;
}
