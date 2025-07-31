import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UsersSortBy } from './users-sort-by';
import { BaseQueryParams } from 'src/core/dto/base.query-params.input-dto';

export class GetUsersQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsEnum(UsersSortBy)
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;

  @IsOptional()
  @IsString()
  searchLoginTerm: string | null = null;

  @IsOptional()
  @IsString()
  searchEmailTerm: string | null = null;
}