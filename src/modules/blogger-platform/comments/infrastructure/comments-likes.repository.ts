import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/modules/database/database.service";

@Injectable()
export class CommentsLikesRepository {
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

    async getUserLikeStatus(commentId: string, userId: string): Promise<"Like" | "Dislike" | "None"> {
        const result = await this.databaseService.sql`
            SELECT status FROM comment_likes
            WHERE comment_id = ${commentId}::uuid
            AND user_id = ${userId}::uuid
            AND deleted_at IS NULL
            LIMIT 1
        `;

        if (!result[0]) {
            return "None";
        }
        return result[0].status as "Like" | "Dislike";
    }

    async getLikesCount(commentId: string): Promise<number> {
        const result = await this.databaseService.sql`
            SELECT COUNT(*) as count FROM comment_likes
            WHERE comment_id = ${commentId}::uuid
            AND status = 'Like'
            AND deleted_at IS NULL
        `;
        return parseInt(result[0].count, 10);
    }

    async getDislikesCount(commentId: string): Promise<number> {
        const result = await this.databaseService.sql`
            SELECT COUNT(*) as count FROM comment_likes
            WHERE comment_id = ${commentId}::uuid
            AND status = 'Dislike'
            AND deleted_at IS NULL
        `;
        return parseInt(result[0].count, 10);
    }

    async deleteAllLikesForComment(commentId: string): Promise<void> {
        await this.databaseService.sql`
            UPDATE comment_likes
            SET deleted_at = ${new Date()}
            WHERE comment_id = ${commentId}::uuid
            AND deleted_at IS NULL
        `;
    }

    async getLikesInfo(commentId: string, userId?: string): Promise<{
        likesCount: number;
        dislikesCount: number;
        myStatus: "Like" | "Dislike" | "None";
    }> {
        const [likesCount, dislikesCount, myStatus] = await Promise.all([
            this.getLikesCount(commentId),
            this.getDislikesCount(commentId),
            userId ? this.getUserLikeStatus(commentId, userId) : Promise.resolve("None" as const)
        ]);

        return {
            likesCount,
            dislikesCount,
            myStatus
        };
    }
}