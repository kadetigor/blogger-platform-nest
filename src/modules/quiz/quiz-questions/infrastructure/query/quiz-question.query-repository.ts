import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { QuizQuestion } from "../../domain/quiz-question.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SortDirection } from "src/core/dto/base.query-params.input-dto";
import { PublishedStatus } from "../../dto/published-status-enum";
import { GetQuizQuestionsQueryParam } from "../../dto/input/input-dto.get-quiz-questions-query-params";
import { QuizQuestionSortBy } from "../../dto/quiz-question-sort-by";

@Injectable()
export class QuizQuestionsQueryRepository {
    constructor(
        @InjectRepository(QuizQuestion) private repository: Repository<QuizQuestion>
    ) {}

    async getAll(query: GetQuizQuestionsQueryParam)  {
        const skip = query.calculateSkip();
        const limit = query.pageSize;

        const whereConditions: FindOptionsWhere<QuizQuestion> = {};

        if (query.bodySearchTerm) {
            whereConditions.body = ILike(`%${query.bodySearchTerm}%`);
        }

        if (query.publishedStatus !== PublishedStatus.All) {
            whereConditions.publishedStatus = query.publishedStatus;
        }

        let orderByColumn: keyof QuizQuestion = 'createdAt';
        switch (query.sortBy) {
            case QuizQuestionSortBy.Body:
                orderByColumn = 'body';
                break;
            case QuizQuestionSortBy.UpdatedAt:
                orderByColumn = 'updatedAt';
                break;
            case QuizQuestionSortBy.CreatedAt:
            default:
                orderByColumn = 'createdAt';
                break;
        }

        const [users, totalCount] = await this.repository.findAndCount({
            where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
            order: {
            [orderByColumn]: query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC'
            },
            skip,
            take: limit
        });
    
        return {
            items: users,
            totalCount,
            page: query.pageNumber,
            pageSize: query.pageSize,
            pagesCount: Math.ceil(totalCount / query.pageSize)
        };
    }
}