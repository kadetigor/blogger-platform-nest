import { MyStatisticViewModel } from "./my-statistic.view-dto";
import { PlayerViewDto } from "./player.view-dto";

export class TopGamePlayerViewDto extends MyStatisticViewModel {
    player: PlayerViewDto;
}

