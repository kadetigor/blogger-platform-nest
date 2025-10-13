import { Injectable, NotFoundException } from "@nestjs/common";
import { Comment, CommentDocument } from "../../domain/comment.entity";
import { CommentatorInfo } from "../../domain/schemas/commentor-info.schema";
import { DatabaseService } from "src/modules/database/database.service";

@Injectable()
export class CommentsQueryRepository {
    constructor(private databaseService: DatabaseService) {}

    private mapToComment(row: any): Comment | null {
        if (!row) return null;

        return new Comment(
            row.id,
            row.content,
            new CommentatorInfo(
                row.commentator_user_id,
                row.commentator_user_login
            ),
            row.post_id,
            row.created_at,
            row.updated_at,
            row.deleted_at
        );
    }

    async getByIdOrNotFoundFail(id: string): Promise<CommentDocument> {
        const result = await this.databaseService.sql`
            SELECT * FROM comments
            WHERE id = ${id}::uuid
            AND deleted_at IS NULL
            LIMIT 1
        `;

        if (!result[0]) {
            throw new NotFoundException('comment not found');
        }

        const comment = this.mapToComment(result[0]);
        if (!comment) {
            throw new NotFoundException('comment not found');
        }

        return comment;
    }
}