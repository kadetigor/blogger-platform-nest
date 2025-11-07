import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query, HttpStatus, HttpCode, ParseUUIDPipe } from '@nestjs/common';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic.auth-guard';
import { QuizQuestionsService } from '../application/quiz-questions.service';
import { QuizQuestionsQueryRepository } from '../infrastructure/query/quiz-question.query-repository';
import { GetQuizQuestionsQueryParam } from '../dto/input/input-dto.get-quiz-questions-query-params';
import { QuizQuestionViewDto } from '../dto/view/quiz-question.view-dto';
import { CreateQuizQuestionDto } from '../dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from '../dto/update-quiz-question.dto';
import { PublishQuizQuestionDto } from '../dto/publish-quiz-question.dto';


@Controller('sa/questions')
export class QuizQuestionsController {
  constructor(
    private readonly quizQuestionsService: QuizQuestionsService,
    private readonly quizQiestionsQueryRepository: QuizQuestionsQueryRepository,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  async findAll(
    @Query() query: GetQuizQuestionsQueryParam,
  ) {
    const result = await this.quizQiestionsQueryRepository.getAll(query)

    return {
      ...result,
      items: result.items.map(quiz => QuizQuestionViewDto.mapToView(quiz))
    };
    
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createQuizQuestion(
    @Body() dto: CreateQuizQuestionDto
  ) {
    const result = await this.quizQuestionsService.create(dto)
    return result
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizQuestionsService.remove(id);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuizQuestionDto: UpdateQuizQuestionDto
  ) {
    return this.quizQuestionsService.updateQuestion(id, updateQuizQuestionDto);
  }

  @Put(':id/publish')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  publish(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishQuizQuestionDto) {
    return this.quizQuestionsService.updateQuestionPublishStatus(id, dto);
  }
}
