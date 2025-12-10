import { Controller, Get, Post, Body, Param, Request, UseGuards, HttpCode, ParseUUIDPipe, ForbiddenException, Query } from '@nestjs/common';
import { PairGameQuizService } from '../application/pair-game-quiz.service';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt.auth-guard';
import { GameViewDto } from '../dto/view/game.view-dto';
import { SubmitAnswerDto } from '../dto/input/submit-answer.dto';
import { mapGameToView } from '../dto/view/mappers/game.mapper';
import { UsersExternalQueryRepository } from 'src/modules/user-accounts/infrastructure/external-query/users.external-query-repository';
import { AnswerViewDto } from '../dto/view/answer.view-dto';
import { PairGameQuizQueryRepository } from '../infrastructure/query/pair-game-quiz.query-repository';
import { GetAllMyGamesQueryParams } from '../dto/input/get-all-users-games.input-query-params';
import { PaginatedGamesViewDto } from '../dto/view/paginated-game.view-dto';
import { MyStatisticViewModel } from '../dto/view/my-statistic.view-dto';

@Controller('pair-game-quiz')
export class PairGameQuizController {
  constructor(
    private readonly pairGameQuizService: PairGameQuizService,
    private readonly usersQueryRepository: UsersExternalQueryRepository,
    private readonly pairGameQuizQueryRepository: PairGameQuizQueryRepository,
  ) {}

  @Get('pairs/my')
  @UseGuards(JwtAuthGuard)
  async getAllMyGames(
    @Request() req,
    @Query() query: GetAllMyGamesQueryParams,
  ): Promise<PaginatedGamesViewDto> {
    const userId = req.user.userId;
    const result = await this.pairGameQuizQueryRepository.findAllMyGames(query, userId);

    // Collect all unique player IDs from the user's games
    const playerIds = new Set<string>();
    result.items.forEach(game => {
      playerIds.add(game.firstPlayerId);
      if (game.secondPlayerId) playerIds.add(game.secondPlayerId);
    });

    // Fetch all player logins in one batch query
    const players = await Promise.all(
      Array.from(playerIds).map(id => this.usersQueryRepository.findById(id))
    );
    const playerMap = new Map(players.map(p => [p!.id, p!.login]));

    // Map each game entity to GameViewDto with player logins
    const mappedGames = result.items.map(game =>
      mapGameToView(
        game,
        playerMap.get(game.firstPlayerId)!,
        game.secondPlayerId ? playerMap.get(game.secondPlayerId)! : null
      )
    );

    return PaginatedGamesViewDto.mapGamesToView({
      items: mappedGames,
      totalCount: result.totalCount,
      page: result.page,
      size: result.pageSize
    });
  }

  @Get('users/my-statistic')
  @UseGuards(JwtAuthGuard)
  async getMyStatistic(
    @Request() req
  ): Promise<MyStatisticViewModel> {
    const userId = req.user.userId

    return this.pairGameQuizQueryRepository.findMyStatistics(userId);
  }

  // Returns current unfinished user game
  @Get('pairs/my-current')
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
  @Get('pairs/:id')
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
  @Post('pairs/connection')
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
  @Post('pairs/my-current/answers')
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