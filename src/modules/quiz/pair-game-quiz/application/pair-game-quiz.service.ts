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

  async findGameById(gameId: string): Promise<PairGameQuiz> {
    const result = await this.pairGameQuizQueryRepository.findGameById(gameId);

    if (!result) {
      throw new NotFoundException('Game not found');
    }
    return result
  }

  async connectToGame(userId: string): Promise<PairGameQuiz> {
    // 1. Check if user already has an active or pending game
    const existingGame = await this.pairGameQuizQueryRepository.findCurrentGameByUserId(userId);
    if (existingGame) {
      throw new ForbiddenException('You are already participating in an active game');
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
    return result;
  }

  async submitAnswer(userId: string, answerBody: string): Promise<GameAnswer> {
    // 1. Find user's active game
    const game = await this.pairGameQuizQueryRepository.findCurrentGameByUserId(userId);
    if (!game || game.status !== GameStatuses.Active) {
      throw new ForbiddenException('No active game found');
    }

    // 2. Check how many answers player has already submitted
    const answeredCount = await this.gameAnswerRepostirory.countAnswers(game.id, userId);
    if (answeredCount >= 5) {
      throw new ForbiddenException('You have already answered all questions');
    }

    // 3. Get the current question to answer (based on answer count)
    // Sort questions by order field to ensure correct sequence
    const sortedQuestions = [...game.gameQuestions].sort((a, b) => a.order - b.order);
    const currentQuestion = sortedQuestions[answeredCount];
    if (!currentQuestion) {
      throw new NotFoundException('Question not found');
    }

    // 4. Check if answer is correct
    const answerStatus = await this.quizQuestionRepository.checkAnswer(
      currentQuestion.question.id,
      answerBody
    );

    // 5. Create and save the answer
    const gameAnswer = new GameAnswer();
    gameAnswer.gameId = game.id;
    gameAnswer.playerId = userId;
    gameAnswer.questionId = currentQuestion.question.id;
    gameAnswer.answerNumber = answeredCount + 1;
    gameAnswer.answerBody = answerBody;
    gameAnswer.answerStatus = answerStatus;

    const savedAnswer = await this.gameAnswerRepostirory.saveAnswer(gameAnswer);

    // 6. Check if game should finish (both players answered all 5 questions)
    if (answeredCount + 1 === 5) {
      await this.checkAndFinishGame(game);
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

  private async checkAndFinishGame(game: PairGameQuiz): Promise<void> {
    if (!game.secondPlayerId) {
      return; // Game can't finish without second player
    }

    // Check if both players have answered all 5 questions
    const firstPlayerAnswers = await this.gameAnswerRepostirory.countAnswers(game.id, game.firstPlayerId);
    const secondPlayerAnswers = await this.gameAnswerRepostirory.countAnswers(game.id, game.secondPlayerId);

    if (firstPlayerAnswers === 5 && secondPlayerAnswers === 5) {
      // Calculate scores (count correct answers)
      const allAnswers = await this.gameAnswerRepostirory.findByGame(game.id);

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

      // Update scores and finish game
      await this.pairGameQuizRepository.updateScores(game.id, firstPlayerScore, secondPlayerScore);
      await this.pairGameQuizRepository.updateGameStatus(game.id, GameStatuses.Finished);

      // Set finish date
      const finishedGame = await this.pairGameQuizQueryRepository.findGameById(game.id);
      if (finishedGame) {
        finishedGame.gameFinishDate = new Date();
        await this.pairGameQuizRepository.save(finishedGame);
      }
    }
  }
}
