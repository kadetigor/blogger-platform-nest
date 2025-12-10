import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersExternalQueryRepository } from 'src/modules/user-accounts/infrastructure/external-query/users.external-query-repository';
import { PairGameQuizQueryRepository } from '../infrastructure/query/pair-game-quiz.query-repository';
import { PairGameQuizRepository } from '../infrastructure/pair-game-quiz.repository';
import { GameAnswerRepository } from '../infrastructure/query/game-answer.repository';
import { QuizQuestionRepository } from '../../quiz-questions/infrastructure/quiz-question.repository';
import { PairGameQuiz } from '../domain/pair-game-quiz.entity';
import { GameStatuses } from '../dto/enums/game-statuses.enum';
import { AnswerStatuses } from '../dto/enums/answer-statuses.enum';
import { GameQuestion } from '../domain/game-question.entity';
import { GameAnswer } from '../domain/game-answer.entity';


@Injectable()
export class PairGameQuizService {

  constructor(
    private readonly userQueryRepository: UsersExternalQueryRepository,
    private readonly pairGameQuizQueryRepository: PairGameQuizQueryRepository,
    private readonly pairGameQuizRepository: PairGameQuizRepository,
    private readonly gameAnswerRepostirory: GameAnswerRepository,
    private readonly quizQuestionRepository: QuizQuestionRepository
  ) {}
//TODO: put all query repository requests straight to the controller 
  async findGameById(gameId: string): Promise<PairGameQuiz> {
    const result = await this.pairGameQuizQueryRepository.findGameById(gameId);

    if (!result) {
      throw new NotFoundException('Game not found');
    }

    // Check if deadline has passed and auto-finish if needed
    if (result.finishDeadline && result.status === GameStatuses.Active && new Date() > result.finishDeadline) {
      await this.autoFinishGameAfterDeadline(result);
      // Fetch updated game
      const updatedGame = await this.pairGameQuizQueryRepository.findGameById(gameId);
      return updatedGame!;
    }

    return result
  }

  async connectToGame(userId: string): Promise<PairGameQuiz> {
    // 1. Check if user already has an active or pending game
    const existingGame = await this.pairGameQuizQueryRepository.findCurrentGameByUserId(userId);
    if (existingGame) {
      // Check if deadline has passed and auto-finish if needed
      if (existingGame.finishDeadline && existingGame.status === GameStatuses.Active && new Date() > existingGame.finishDeadline) {
        await this.autoFinishGameAfterDeadline(existingGame);
        // After finishing, allow user to connect to a new game (fall through)
      } else {
        throw new ForbiddenException('You are already participating in an active game');
      }
    }

    // 2. Try to find a pending game (not created by this user)
    const pendingGame = await this.pairGameQuizQueryRepository.findPendingGame(userId);

    if (pendingGame) {
      // 3. Join existing pending game as second player
      const questionIds = await this.quizQuestionRepository.getRandomPublishedQuestions(5);
      await this.pairGameQuizRepository.addSecondPlayer(pendingGame.id, userId, questionIds);
      await this.pairGameQuizRepository.updateGameStatus(pendingGame.id, GameStatuses.Active);

      // Update game start date
      const game = await this.pairGameQuizQueryRepository.findGameById(pendingGame.id);
      if (game) {
        game.gameStartDate = new Date();
        await this.pairGameQuizRepository.save(game);
      }

      return await this.pairGameQuizQueryRepository.findGameById(pendingGame.id) as PairGameQuiz;
    } else {
      // 4. Create new pending game
      const newGame = new PairGameQuiz();
      newGame.firstPlayerId = userId;
      newGame.status = GameStatuses.PendingSecondPlayer;
      newGame.pairCreatedAt = new Date();

      return await this.pairGameQuizRepository.save(newGame);
    }
  }

  async getCurrentGame(userId: string): Promise<PairGameQuiz> {
    const result = await this.pairGameQuizQueryRepository.findCurrentGameByUserId(userId);

    if (!result) {
      throw new NotFoundException('No active game found for current user');
    }

    // Check if deadline has passed and auto-finish if needed
    if (result.finishDeadline && result.status === GameStatuses.Active && new Date() > result.finishDeadline) {
      await this.autoFinishGameAfterDeadline(result);
      throw new NotFoundException('No active game found for current user');
    }

    return result;
  }

  async submitAnswer(userId: string, answerBody: string): Promise<GameAnswer> {
    // 1. Find user's active game
    const game = await this.pairGameQuizQueryRepository.findCurrentGameByUserId(userId);
    if (!game || game.status !== GameStatuses.Active) {
      throw new ForbiddenException('No active game found');
    }

    // 2. Check if deadline has passed and auto-finish if needed
    if (game.finishDeadline && new Date() > game.finishDeadline) {
      await this.autoFinishGameAfterDeadline(game);
      throw new ForbiddenException('Game has ended due to timeout');
    }

    // 3. Check how many answers player has already submitted
    const answeredCount = await this.gameAnswerRepostirory.countAnswers(game.id, userId);
    if (answeredCount >= 5) {
      throw new ForbiddenException('You have already answered all questions');
    }

    // 4. Get the current question to answer (based on answer count)
    // Sort questions by order field to ensure correct sequence
    const sortedQuestions = [...game.gameQuestions].sort((a, b) => a.order - b.order);
    const currentQuestion = sortedQuestions[answeredCount];
    if (!currentQuestion) {
      throw new NotFoundException('Question not found');
    }

    // 5. Check if answer is correct
    const answerStatus = await this.quizQuestionRepository.checkAnswer(
      currentQuestion.question.id,
      answerBody
    );

    // 6. Create and save the answer
    const gameAnswer = new GameAnswer();
    gameAnswer.gameId = game.id;
    gameAnswer.playerId = userId;
    gameAnswer.questionId = currentQuestion.question.id;
    gameAnswer.answerNumber = answeredCount + 1;
    gameAnswer.answerBody = answerBody;
    gameAnswer.answerStatus = answerStatus;

    const savedAnswer = await this.gameAnswerRepostirory.saveAnswer(gameAnswer);

    // 7. Check if current player just finished all 5 questions
    if (answeredCount + 1 === 5) {
      await this.handlePlayerFinished(game, userId);
    }

    return savedAnswer;
  }

  async finishGame(gameId: string): Promise<boolean> {
    const game = await this.pairGameQuizQueryRepository.findGameById(gameId)

    if (!game) {
      throw new Error('Faild to find current game')
    }

    const result = await this.pairGameQuizRepository.updateGameStatus(gameId, GameStatuses.Finished)

    if (!result) {
      throw new Error('Faild to finish current game')
    }

    return true
  }


  async checkAnswer(questionId: string, answer: string): Promise<AnswerStatuses> {
    const answerStatus = await this.quizQuestionRepository.checkAnswer(questionId, answer)

    if (!answerStatus) {
      throw new Error('Faild to check the status of the answer')
    }

    return answerStatus
  }

  /**
   * Called when a player finishes all 5 questions
   */
  private async handlePlayerFinished(game: PairGameQuiz, playerId: string): Promise<void> {
    if (!game.secondPlayerId) {
      return; // Can't finish game without second player
    }

    // Determine opponent player ID
    const opponentId = playerId === game.firstPlayerId ? game.secondPlayerId : game.firstPlayerId;

    // Check if opponent has also finished
    const opponentAnswerCount = await this.gameAnswerRepostirory.countAnswers(game.id, opponentId);

    if (opponentAnswerCount === 5) {
      // Both players finished - finish game immediately
      await this.finishGameWithScores(game);
    } else {
      // Opponent hasn't finished - set 10 second deadline
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);

      await this.pairGameQuizRepository.updateDeadline(game.id, deadline);
    }
  }

  /**
   * Auto-finish game when deadline expires
   * Creates incorrect answers for all unanswered questions
   */
  private async autoFinishGameAfterDeadline(game: PairGameQuiz): Promise<void> {
    if (!game.secondPlayerId || game.status !== GameStatuses.Active) {
      return;
    }

    // Find which player didn't finish
    const firstPlayerAnswers = await this.gameAnswerRepostirory.countAnswers(game.id, game.firstPlayerId);
    const secondPlayerAnswers = await this.gameAnswerRepostirory.countAnswers(game.id, game.secondPlayerId);

    // Create incorrect answers for unanswered questions
    const sortedQuestions = [...game.gameQuestions].sort((a, b) => a.order - b.order);

    if (firstPlayerAnswers < 5) {
      await this.createIncorrectAnswersForRemainingQuestions(
        game,
        game.firstPlayerId,
        firstPlayerAnswers,
        sortedQuestions
      );
    }

    if (secondPlayerAnswers < 5) {
      await this.createIncorrectAnswersForRemainingQuestions(
        game,
        game.secondPlayerId,
        secondPlayerAnswers,
        sortedQuestions
      );
    }

    // Finish game with final scores
    await this.finishGameWithScores(game);
  }

  /**
   * Creates incorrect answers for remaining unanswered questions
   */
  private async createIncorrectAnswersForRemainingQuestions(
    game: PairGameQuiz,
    playerId: string,
    currentAnswerCount: number,
    sortedQuestions: GameQuestion[]
  ): Promise<void> {
    for (let i = currentAnswerCount; i < 5; i++) {
      const question = sortedQuestions[i];
      if (!question) continue;

      const gameAnswer = new GameAnswer();
      gameAnswer.gameId = game.id;
      gameAnswer.playerId = playerId;
      gameAnswer.questionId = question.question.id;
      gameAnswer.answerNumber = i + 1;
      gameAnswer.answerBody = ''; // Empty answer
      gameAnswer.answerStatus = AnswerStatuses.Incorrect;

      await this.gameAnswerRepostirory.saveAnswer(gameAnswer);
    }
  }

  /**
   * Calculate scores and finish the game
   */
  private async finishGameWithScores(game: PairGameQuiz): Promise<void> {
    if (!game.secondPlayerId) {
      return;
    }

    // Get all answers
    const allAnswers = await this.gameAnswerRepostirory.findByGame(game.id);

    // Count correct answers for each player
    const firstPlayerCorrect = allAnswers
      .filter(a => a.playerId === game.firstPlayerId && a.answerStatus === AnswerStatuses.Correct)
      .length;

    const secondPlayerCorrect = allAnswers
      .filter(a => a.playerId === game.secondPlayerId && a.answerStatus === AnswerStatuses.Correct)
      .length;

    let firstPlayerScore = firstPlayerCorrect;
    let secondPlayerScore = secondPlayerCorrect;

    // Determine who finished first and award bonus point
    const firstPlayerLastAnswer = allAnswers
      .filter(a => a.playerId === game.firstPlayerId)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())[0];

    const secondPlayerLastAnswer = allAnswers
      .filter(a => a.playerId === game.secondPlayerId)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())[0];

    // Award bonus point to the player who finished first (if they have at least 1 correct answer)
    if (firstPlayerLastAnswer && secondPlayerLastAnswer) {
      if (firstPlayerLastAnswer.addedAt < secondPlayerLastAnswer.addedAt && firstPlayerScore > 0) {
        firstPlayerScore++;
      } else if (secondPlayerLastAnswer.addedAt < firstPlayerLastAnswer.addedAt && secondPlayerScore > 0) {
        secondPlayerScore++;
      }
    }

    // Update game with final state using targeted updates
    await this.pairGameQuizRepository.updateScores(game.id, firstPlayerScore, secondPlayerScore);
    await this.pairGameQuizRepository.updateGameStatus(game.id, GameStatuses.Finished);
    await this.pairGameQuizRepository.updateFinishDate(game.id, new Date());
  }
}
