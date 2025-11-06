import { InjectRepository } from "@nestjs/typeorm";
import { QuizQuestion } from "../entities/quiz-question.entity";
import { Repository } from "typeorm";
import { CreateQuizQuestionDto } from "../dto/create-quiz-question.dto";
import { NotFoundException } from "@nestjs/common";
import { UpdateQuizQuestionDto } from "../dto/update-quiz-question.dto";
import { PublishQuizQuestionDto } from "../dto/publish-quiz-question.dto";

export class QuizQuestionRepository {
    constructor(
        @InjectRepository(QuizQuestion) private repository: Repository<QuizQuestion>
    ) {}

    async save(quizQuestion: QuizQuestion): Promise<QuizQuestion> {
        return this.repository.save(quizQuestion);
    }

    async createQuizQuestion(dto: CreateQuizQuestionDto): Promise<QuizQuestion> {
        const result = await this.repository.create({
            body: dto.body,
            correctAnswers: dto.correctAnswers
        });

        return this.repository.save(result)
    }

    async removeQuestion(id: string): Promise<void> {
        const result = await this.repository.delete({id});

        if (result.affected === 0) {
            throw new NotFoundException('Quiz question not found');
        }
    }

    async updateQuestion(id: string, dto: UpdateQuizQuestionDto): Promise<boolean> {
        const result = await this.repository.update({id}, dto);

        if (result.affected === 0) {
            throw new NotFoundException('Quiz question not found');
        }

        return true;
    }

    async updateQuestionPublishStatus(id: string, dto: PublishQuizQuestionDto): Promise<boolean> {
        const result = await this.repository.update({id}, {published: dto.published});

        if (result.affected === 0) {
            throw new NotFoundException('Quiz question not found');
        }

        return true;
    }
}