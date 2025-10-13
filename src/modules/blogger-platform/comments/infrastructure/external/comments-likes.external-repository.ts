import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/modules/database/database.service";

@Injectable()
export class CommentsLikesExternalRepository {
    constructor(private databaseService: DatabaseService) {}

    async setLikeStatus(commentId: string, userId: string, status: "Like" | "Dislike" | "None"): Promise<void> {
        if (status === "None") {
            // Remove the like/dislike (soft delete)
            await this.databaseService.sql`
                UPDATE comment_likes
                SET deleted_at = ${new Date()}
                WHERE comment_id = ${commentId}::uuid
                AND user_id = ${userId}::uuid
                AND deleted_at IS NULL
            `;
            return;
        }

        // Check if a like/dislike already exists
        const existing = await this.databaseService.sql`
            SELECT * FROM comment_likes
            WHERE comment_id = ${commentId}::uuid
            AND user_id = ${userId}::uuid
            AND deleted_at IS NULL
            LIMIT 1
        `;

        if (existing[0]) {
            // Update existing like/dislike
            await this.databaseService.sql`
                UPDATE comment_likes
                SET status = ${status}, updated_at = ${new Date()}
                WHERE comment_id = ${commentId}::uuid
                AND user_id = ${userId}::uuid
                AND deleted_at IS NULL
            `;
        } else {
            // Insert new like/dislike
            await this.databaseService.sql`
                INSERT INTO comment_likes (comment_id, user_id, status, created_at, updated_at)
                VALUES (
                    ${commentId}::uuid,
                    ${userId}::uuid,
                    ${status},
                    ${new Date()},
                    ${new Date()}
                )
            `;
        }
    }
}