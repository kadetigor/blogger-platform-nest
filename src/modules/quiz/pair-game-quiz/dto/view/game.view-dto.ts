import { AnswerStatuses } from "../enums/answer-statuses.enum";
import { GameStatuses } from "../enums/game-statuses.enum";
import { GamePlayerProgressViewModel } from "./game-player-progress.view-dto";
import { QuestionViewDto } from "./question.view-dto";

export class GameViewDto {
    id: string;
    firstPlayerProgress: GamePlayerProgressViewModel
    secondPlayerProgress: GamePlayerProgressViewModel
    questions: [QuestionViewDto];
    status: GameStatuses;
    pairCreatedDate: Date;
    startGameDate: Date;
    finishGameDate: Date;
}