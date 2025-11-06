import { IsArray, IsEnum, IsString, Length } from "class-validator"

export class CreateQuizQuestionDto {
    @IsString()
    @Length(10, 500)
    body: string

    @IsArray()
    correctAnswers: string[]
}
