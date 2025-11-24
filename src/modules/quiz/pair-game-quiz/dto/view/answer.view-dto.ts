import { AnswerStatuses } from "../enums/answer-statuses.enum";

export class AnswerViewDto {
    questionId: string;
    answerStatus: AnswerStatuses;
    addedAt: Date;
}