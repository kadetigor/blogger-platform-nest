import { PartialType } from '@nestjs/swagger';
import { CreatePairGameQuizDto } from './create-pair-game-quiz.dto';

export class UpdatePairGameQuizDto extends PartialType(CreatePairGameQuizDto) {}
