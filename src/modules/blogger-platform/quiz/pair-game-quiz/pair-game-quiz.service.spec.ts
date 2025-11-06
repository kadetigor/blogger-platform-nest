import { Test, TestingModule } from '@nestjs/testing';
import { PairGameQuizService } from './pair-game-quiz.service';

describe('PairGameQuizService', () => {
  let service: PairGameQuizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PairGameQuizService],
    }).compile();

    service = module.get<PairGameQuizService>(PairGameQuizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
