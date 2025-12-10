import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { TopGamePlayerViewDto } from "./top-game-player.view-dto";

export class PaginatedTopPlayerViewDto extends PaginatedViewDto<TopGamePlayerViewDto[]> {
    items: TopGamePlayerViewDto[];
}