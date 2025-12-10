import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { GameViewDto } from "./game.view-dto";

export class PaginatedGamesViewDto extends PaginatedViewDto<GameViewDto[]> {
  items: GameViewDto[];

  static mapGamesToView(data: {
    items: GameViewDto[];
    totalCount: number;
    page: number;
    size: number;
  }): PaginatedGamesViewDto {
    return {
      items: data.items,
      totalCount: data.totalCount,
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
    };
  }
}