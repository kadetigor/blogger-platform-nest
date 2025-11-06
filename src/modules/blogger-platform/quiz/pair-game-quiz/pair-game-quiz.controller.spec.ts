import { Test, TestingModule } from '@nestjs/testing';
import { PairGameQuizController } from './pair-game-quiz.controller';
import { PairGameQuizService } from './pair-game-quiz.service';

describe('PairGameQuizController', () => {
  let controller: PairGameQuizController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PairGameQuizController],
      providers: [PairGameQuizService],
    }).compile();

    controller = module.get<PairGameQuizController>(PairGameQuizController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
