import { GameStatuses } from "../enums/game-statuses.enum";
import { GamePlayerProgressViewModel } from "./game-player-progress.view-dto";
import { QuestionViewDto } from "./question.view-dto";

export class GameViewDto {
    id: string;
    firstPlayerProgress: GamePlayerProgressViewModel
    secondPlayerProgress: GamePlayerProgressViewModel | null
    questions: [QuestionViewDto] | null;
    status: GameStatuses;
    pairCreatedDate: Date | null;
    startGameDate: Date | null;
    finishGameDate: Date | null;
}