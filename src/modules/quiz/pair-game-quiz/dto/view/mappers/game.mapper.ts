import { PairGameQuiz } from "../../../domain/pair-game-quiz.entity";
import { GameViewDto } from "../game.view-dto";
import { GamePlayerProgressViewModel } from "../game-player-progress.view-dto";
import { PlayerViewDto } from "../player.view-dto";
import { QuestionViewDto } from "../question.view-dto";
import { AnswerViewDto } from "../answer.view-dto";
import { GameStatuses } from "../../enums/game-statuses.enum";
import { AnswerStatuses } from "../../enums/answer-statuses.enum";

export function mapGameToView(game: PairGameQuiz, firstPlayerLogin: string, secondPlayerLogin: string | null): GameViewDto {
    const gameView = new GameViewDto();

    gameView.id = game.id;
    gameView.status = game.status;
    gameView.pairCreatedDate = game.pairCreatedAt;
    gameView.startGameDate = game.gameStartDate;
    gameView.finishGameDate = game.gameFinishDate;

    // Map first player progress
    const firstPlayerAnswers = game.gameAnswers?.filter(a => a.playerId === game.firstPlayerId) || [];
    // Calculate score dynamically from correct answers, or use stored score if game is finished
    const firstPlayerScore = game.status === GameStatuses.Finished
        ? game.firstPlayerScore
        : firstPlayerAnswers.filter(a => a.answerStatus === AnswerStatuses.Correct).length;

    gameView.firstPlayerProgress = mapPlayerProgress(
        game.firstPlayerId,
        firstPlayerLogin,
        firstPlayerAnswers,
        firstPlayerScore
    );

    // Map second player progress (null if game is pending)
    if (game.status === GameStatuses.PendingSecondPlayer || !game.secondPlayerId) {
        gameView.secondPlayerProgress = null as any;
    } else {
        const secondPlayerAnswers = game.gameAnswers?.filter(a => a.playerId === game.secondPlayerId) || [];
        // Calculate score dynamically from correct answers, or use stored score if game is finished
        const secondPlayerScore = game.status === GameStatuses.Finished
            ? (game.secondPlayerScore || 0)
            : secondPlayerAnswers.filter(a => a.answerStatus === AnswerStatuses.Correct).length;

        gameView.secondPlayerProgress = mapPlayerProgress(
            game.secondPlayerId!,
            secondPlayerLogin!,
            secondPlayerAnswers,
            secondPlayerScore
        );
    }

    // Map questions (null if pending)
    if (game.status === GameStatuses.PendingSecondPlayer) {
        gameView.questions = null as any;
    } else {
        // Sort by order field to maintain consistent question sequence
        const sortedQuestions = [...(game.gameQuestions || [])].sort((a, b) => a.order - b.order);
        gameView.questions = sortedQuestions.map(gq => ({
            id: gq.question.id,
            body: gq.question.body
        } as QuestionViewDto)) as [QuestionViewDto];
    }

    return gameView;
}

function mapPlayerProgress(
    playerId: string,
    playerLogin: string,
    answers: any[],
    score: number
): GamePlayerProgressViewModel {
    const progress = new GamePlayerProgressViewModel();

    progress.player = {
        id: playerId,
        login: playerLogin
    } as PlayerViewDto;

    progress.score = score;

    progress.answers = answers
        .sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())
        .map(a => ({
            questionId: a.questionId,
            answerStatus: a.answerStatus,
            addedAt: a.addedAt
        } as AnswerViewDto));

    return progress;
}