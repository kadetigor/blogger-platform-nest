import { Controller, Get, Post, Body, Param, Request, UseGuards, HttpCode, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { PairGameQuizService } from '../application/pair-game-quiz.service';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt.auth-guard';
import { GameViewDto } from '../dto/view/game.view-dto';
import { SubmitAnswerDto } from '../dto/input/submit-answer.dto';
import { mapGameToView } from '../dto/view/mappers/game.mapper';
import { UsersExternalQueryRepository } from 'src/modules/user-accounts/infrastructure/external-query/users.external-query-repository';
import { AnswerViewDto } from '../dto/view/answer.view-dto';

@Controller('pair-game-quiz/pairs')
export class PairGameQuizController {
  constructor(
    private readonly pairGameQuizService: PairGameQuizService,
    private readonly usersQueryRepository: UsersExternalQueryRepository
  ) {}

  // Returns current unfinished user game
  @Get('my-current')
  @UseGuards(JwtAuthGuard)
  async getCurrentGame(@Request() req): Promise<GameViewDto> {
    const userId = req.user.userId;
    const game = await this.pairGameQuizService.getCurrentGame(userId);

    // Get player logins
    const firstPlayer = await this.usersQueryRepository.findById(game.firstPlayerId);
    const secondPlayer = game.secondPlayerId
      ? await this.usersQueryRepository.findById(game.secondPlayerId)
      : null;

    return mapGameToView(game, firstPlayer!.login, secondPlayer?.login || null);
  }

  // Returns game by id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getCurrentGameById(
    @Param('id', ParseUUIDPipe) gameId: string,
    @Request() req
  ): Promise<GameViewDto> {
    const userId = req.user.userId;
    const game = await this.pairGameQuizService.findGameById(gameId);

    // Verify user is part of this game
    if (game.firstPlayerId !== userId && game.secondPlayerId !== userId) {
      throw new ForbiddenException('You are not a participant of this game');
    }

    // Get player logins
    const firstPlayer = await this.usersQueryRepository.findById(game.firstPlayerId);
    const secondPlayer = game.secondPlayerId
      ? await this.usersQueryRepository.findById(game.secondPlayerId)
      : null;

    return mapGameToView(game, firstPlayer!.login, secondPlayer?.login || null);
  }

  // Connect current user to existing random pending pair or create new pair which will be waiting second player
  @Post('connection')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async connectToExistingOrCreateNewGame(@Request() req): Promise<GameViewDto> {
    const userId = req.user.userId;
    const game = await this.pairGameQuizService.connectToGame(userId);

    // Get player logins
    const firstPlayer = await this.usersQueryRepository.findById(game.firstPlayerId);
    const secondPlayer = game.secondPlayerId
      ? await this.usersQueryRepository.findById(game.secondPlayerId)
      : null;

    return mapGameToView(game, firstPlayer!.login, secondPlayer?.login || null);
  }

  // Send answer for next not answered question in active pair
  @Post('my-current/answers')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async submitAnswer(
    @Request() req,
    @Body() dto: SubmitAnswerDto
  ): Promise<AnswerViewDto> {
    const userId = req.user.userId;
    const answer = await this.pairGameQuizService.submitAnswer(userId, dto.answer);

    return {
      questionId: answer.questionId,
      answerStatus: answer.answerStatus,
      addedAt: answer.addedAt
    };
  }
}