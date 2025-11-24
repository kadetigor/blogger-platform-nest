import { AnswerStatuses } from "../enums/answer-statuses.enum";
import { AnswerViewDto } from "./answer.view-dto";
import { PlayerViewDto } from "./player.view-dto";

export class GamePlayerProgressViewModel {
    answers: AnswerViewDto
    player: PlayerViewDto
    score: number;
}