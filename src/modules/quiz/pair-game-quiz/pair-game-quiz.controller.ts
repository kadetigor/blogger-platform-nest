import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PairGameQuizService } from './pair-game-quiz.service';
import { CreatePairGameQuizDto } from './dto/create-pair-game-quiz.dto';
import { UpdatePairGameQuizDto } from './dto/update-pair-game-quiz.dto';

@Controller('pair-game-quiz')
export class PairGameQuizController {
  constructor(private readonly pairGameQuizService: PairGameQuizService) {}

  @Post()
  create(@Body() createPairGameQuizDto: CreatePairGameQuizDto) {
    return this.pairGameQuizService.create(createPairGameQuizDto);
  }

  @Get()
  findAll() {
    return this.pairGameQuizService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pairGameQuizService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePairGameQuizDto: UpdatePairGameQuizDto) {
    return this.pairGameQuizService.update(+id, updatePairGameQuizDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pairGameQuizService.remove(+id);
  }
}
