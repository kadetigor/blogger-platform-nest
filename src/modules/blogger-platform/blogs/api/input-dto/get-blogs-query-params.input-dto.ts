import { BaseQueryParams } from "src/core/dto/base.query-params.input-dto";
import { BlogsSortBy } from "./blogs-sort-by";


export class GetBlogsQueryParams extends BaseQueryParams {
    sortBy = BlogsSortBy.CreatedAt;
    searchNameTerm: string | null = null;
    searchDescriptionTerm: string | null = null;
}