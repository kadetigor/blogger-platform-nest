import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { PairGameQuizService } from '../application/pair-game-quiz.service';
import { CreatePairGameQuizDto } from '../dto/create-pair-game-quiz.dto';
import { UpdatePairGameQuizDto } from '../dto/update-pair-game-quiz.dto';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt.auth-guard';


@Controller('pair-game-quiz/pairs')
export class PairGameQuizController {
  constructor(private readonly pairGameQuizService: PairGameQuizService) {}

  // Returns current unfinished user game
  @Get('my-current')
  @UseGuards(JwtAuthGuard)
  async getCurrentGame(
    @Request() req,
  ) {
    const userId = req.user.userId

    return this.pairGameQuizService.getCurrentGame(userId);
  }

  // Returns game by id
  @Get(':id')
  getCurrentGameById(@Param('id') id: string) {
    return this.pairGameQuizService.findOne(+id);
  }

  // Connect current user to existing random pending pair or crerate new pair which will be waiting second player
  @Post('connection')
  connect(@Body() createPairGameQuizDto: CreatePairGameQuizDto) {
    return this.pairGameQuizService.create(createPairGameQuizDto);
  }

  // Send answer for next not answered question in active pair
  @Post()
  answer(@Body() createPairGameQuizDto: CreatePairGameQuizDto) {
    return this.pairGameQuizService.create(createPairGameQuizDto);
  }

}
