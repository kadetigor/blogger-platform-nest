import { IsArray, IsString, Length } from 'class-validator';

export class UpdateQuizQuestionDto {
    @IsString()
    @Length(10, 500)
    body: string;

    @IsArray()
    correctAnswers: string[];
}
