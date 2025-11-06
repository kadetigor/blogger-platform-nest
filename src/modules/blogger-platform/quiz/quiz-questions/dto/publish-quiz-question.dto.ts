import { IsBoolean } from 'class-validator';

export class PublishQuizQuestionDto {
  @IsBoolean()
  published: boolean;
}