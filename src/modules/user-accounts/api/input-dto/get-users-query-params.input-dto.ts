import { UsersSortBy } from './users-sort-by';
import { BaseQueryParams } from "src/core/dto/base.query-params.input-dto";

 
//dto для запроса списка юзеров с пагинацией, сортировкой, фильтрами
export class GetUsersQueryParams extends BaseQueryParams {
  sortBy = UsersSortBy.CreatedAt;
  searchLoginTerm: string | null = null;
  searchEmailTerm: string | null = null;
}