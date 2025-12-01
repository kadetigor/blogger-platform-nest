import { InjectRepository } from "@nestjs/typeorm";
import { QuizQuestion } from "../domain/quiz-question.entity";
import { Repository } from "typeorm";
import { CreateQuizQuestionDto } from "../dto/create-quiz-question.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateQuizQuestionDto } from "../dto/update-quiz-question.dto";
import { PublishQuizQuestionDto } from "../dto/publish-quiz-question.dto";
import { AnswerStatuses } from "../../pair-game-quiz/dto/enums/answer-statuses.enum";
import { PublishedStatus } from "../dto/published-status-enum";

@Injectable()
export class QuizQuestionRepository {
    constructor(
        @InjectRepository(QuizQuestion) private repository: Repository<QuizQuestion>
    ) {}

    async save(quizQuestion: QuizQuestion): Promise<QuizQuestion> {
        return this.repository.save(quizQuestion);
    }

    async createQuizQuestion(dto: CreateQuizQuestionDto): Promise<QuizQuestion> {
        const result = this.repository.create({
            body: dto.body,
            correctAnswers: dto.correctAnswers,
            updatedAt: null
        });

        return this.repository.save(result);
    }

    async removeQuestion(id: string): Promise<void> {
        const result = await this.repository.delete({id});

        if (result.affected === 0) {
            throw new NotFoundException('Quiz question not found');
        }
    }

    async updateQuestion(id: string, dto: UpdateQuizQuestionDto): Promise<boolean> {
        const result = await this.repository.update({id}, {
            ...dto,
            updatedAt: new Date()
        });

        if (result.affected === 0) {
            throw new NotFoundException('Quiz question not found');
        }

        return true;
    }

    async updateQuestionPublishStatus(id: string, dto: PublishQuizQuestionDto): Promise<boolean> {
        const result = await this.repository.update({id}, {
            publishedStatus: dto.published ? PublishedStatus.Published : PublishedStatus.NotPublished,
            updatedAt: new Date()
        });

        if (result.affected === 0) {
            throw new NotFoundException('Quiz question not found');
        }

        return true;
    }

    async getRandomPublishedQuestions(limit: number = 5): Promise<string[]> {
        const questions = await this.repository
            .createQueryBuilder('question')
            .where('question.published_status = :status', { status: PublishedStatus.Published })
            .orderBy('RANDOM()')
            .limit(limit)
            .getMany();

        if (questions.length < limit) {
            throw new NotFoundException(`Not enough published questions. Found ${questions.length}, need ${limit}`);
        }

        const questionIds = questions.map(q => q.id);

        return questionIds;
    }

    async checkAnswer(questionId: string, answer: string): Promise<AnswerStatuses> {
        const question = await this.repository.findOne({
            where: { id: questionId }
        })

        if (!question) {
            throw new Error(`Question with id ${questionId} not found`)
        }
        
        const normalizedAnswer = answer.trim().toLowerCase()
        const isCorrect = question.correctAnswers.some(
            correctAnswer => correctAnswer.trim().toLowerCase() === normalizedAnswer
        )

        return isCorrect ? AnswerStatuses.Correct : AnswerStatuses.Incorrect
    }
}