import { IsEnum, IsOptional } from "class-validator";
import { BaseQueryParams } from "src/core/dto/base.query-params.input-dto";
import { MyGamesSortBy } from "../my-games.sort-by";
import { Transform } from "class-transformer";

export class GetAllMyGamesQueryParams extends BaseQueryParams {
    @Transform(({ value }) => value || MyGamesSortBy.PairCreatedDate)
    @IsOptional()
    @IsEnum(MyGamesSortBy)
    sortBy: MyGamesSortBy = MyGamesSortBy.PairCreatedDate 
};
