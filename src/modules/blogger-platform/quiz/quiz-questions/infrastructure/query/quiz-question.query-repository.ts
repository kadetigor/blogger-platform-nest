import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { QuizQuestion } from "../../domain/quiz-question.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SortDirection } from "src/core/dto/base.query-params.input-dto";
import { PublishedStatus } from "../../dto/published-status-enum";
import { GetQuizQuestionsQueryParam } from "../../dto/input/input-dto.get-quiz-questions-query-params";

@Injectable()
export class QuizQuestionsQueryRepository {
    constructor(
        @InjectRepository(QuizQuestion) private repository: Repository<QuizQuestion>
    ) {}

    async getAll(query: GetQuizQuestionsQueryParam)  {
        const skip = query.calculateSkip();
        const limit = query.pageSize;

        // Build WHERE conditions - use single object for AND conditions
        const whereConditions: FindOptionsWhere<QuizQuestion> = {};

        if (query.bodySerchTerm) {
            whereConditions.body = ILike(`%${query.bodySerchTerm}%`);
        }

        // Handle publishStatus filter
        if (query.publishStatus !== PublishedStatus.All) {
            whereConditions.publishedStatus = query.publishStatus;
        }

        // Build ORDER BY dynamically
        let orderByColumn: keyof QuizQuestion = 'createdAt';
        switch (query.sortBy) {
            default:
            orderByColumn = 'createdAt';
            break;
        }

        // Get both items and count
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