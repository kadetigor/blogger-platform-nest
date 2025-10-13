import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/modules/database/database.service";

@Injectable()
export class PostLikeRepository {
    constructor(private databaseService: DatabaseService) {}

    async setLikeStatus(postId: string, userId: string, status: string, userLogin: string): Promise<void> {
        // Validate required fields
        if (!postId) {
            throw new Error(`postId is required but got: ${postId}`);
        }
        if (!userId) {
            throw new Error(`userId is required but got: ${userId}`);
        }

        if (status === "None") {
            // Remove the like/dislike (soft delete)
            await this.databaseService.sql`
                UPDATE post_likes
                SET deleted_at = ${new Date()}
                WHERE post_id = ${postId}::uuid
                AND user_id = ${userId}::uuid
                AND deleted_at IS NULL
            `;
            return;
        }

        // Check if a like/dislike already exists
        const existing = await this.databaseService.sql`
            SELECT * FROM post_likes
            WHERE post_id = ${postId}::uuid
            AND user_id = ${userId}::uuid
            AND deleted_at IS NULL
            LIMIT 1
        `;

        if (existing[0]) {
            // Update existing like/dislike
            await this.databaseService.sql`
                UPDATE post_likes
                SET
                    status = ${status},
                    added_at = ${new Date()},
                    login = ${userLogin},
                    updated_at = ${new Date()}
                WHERE post_id = ${postId}::uuid
                AND user_id = ${userId}::uuid
                AND deleted_at IS NULL
            `;
        } else {
            // Insert new like/dislike
            await this.databaseService.sql`
                INSERT INTO post_likes (post_id, user_id, status, added_at, login, created_at, updated_at)
                VALUES (
                    ${postId}::uuid,
                    ${userId}::uuid,
                    ${status},
                    ${new Date()},
                    ${userLogin},
                    ${new Date()},
                    ${new Date()}
                )
            `;
        }
    }

    async getUserLikeStatus(postId: string, userId: string): Promise<"Like" | "Dislike" | "None"> {
        const result = await this.databaseService.sql`
            SELECT status FROM post_likes
            WHERE post_id = ${postId}::uuid
            AND user_id = ${userId}::uuid
            AND deleted_at IS NULL
            LIMIT 1
        `;

        if (!result[0]) {
            return "None";
        }
        return result[0].status as "Like" | "Dislike";
    }

    async getLikesCount(postId: string): Promise<number> {
        const result = await this.databaseService.sql`
            SELECT COUNT(*) as count FROM post_likes
            WHERE post_id = ${postId}::uuid
            AND status = 'Like'
            AND deleted_at IS NULL
        `;
        return parseInt(result[0].count, 10);
    }

    async getDislikesCount(postId: string): Promise<number> {
        const result = await this.databaseService.sql`
            SELECT COUNT(*) as count FROM post_likes
            WHERE post_id = ${postId}::uuid
            AND status = 'Dislike'
            AND deleted_at IS NULL
        `;
        return parseInt(result[0].count, 10);
    }

    async deleteAllLikesForPost(postId: string): Promise<void> {
        await this.databaseService.sql`
            UPDATE post_likes
            SET deleted_at = ${new Date()}
            WHERE post_id = ${postId}::uuid
            AND deleted_at IS NULL
        `;
    }

    async findNewestLikes(postId: string): Promise<Array<{
        addedAt: Date;
        userId: string;
        login: string;
    }>> {
        const result = await this.databaseService.sql`
            SELECT added_at, user_id, login
            FROM post_likes
            WHERE post_id = ${postId}::uuid
            AND status = 'Like'
            AND deleted_at IS NULL
            ORDER BY added_at DESC
            LIMIT 3
        `;

        return result.map(row => ({
            addedAt: row.added_at,
            userId: row.user_id,
            login: row.login
        }));
    }

    async getExtendedLikesInfo(postId: string, userId?: string): Promise<{
        likesCount: number;
        dislikesCount: number;
        myStatus: "Like" | "Dislike" | "None";
        newestLikes: Array<{ addedAt: Date; userId: string; login: string; }>
    }> {
        const [likesCount, dislikesCount, myStatus, newestLikes] = await Promise.all([
            this.getLikesCount(postId),
            this.getDislikesCount(postId),
            userId ? this.getUserLikeStatus(postId, userId) : Promise.resolve("None" as const),
            this.findNewestLikes(postId),
        ]);

        return {
            likesCount,
            dislikesCount,
            myStatus,
            newestLikes
        };
    }

    async getBatchExtendedLikesInfo(postIds: string[], userId?: string): Promise<Map<string, {
        likesCount: number;
        dislikesCount: number;
        myStatus: "Like" | "Dislike" | "None";
        newestLikes: Array<{ addedAt: Date; userId: string; login: string; }>
    }>> {
        if (postIds.length === 0) {
            return new Map();
        }

        // Single query to get all likes/dislikes counts and user statuses
        const statsQuery = userId
            ? this.databaseService.sql`
                SELECT
                    post_id,
                    COUNT(CASE WHEN status = 'Like' THEN 1 END) as likes_count,
                    COUNT(CASE WHEN status = 'Dislike' THEN 1 END) as dislikes_count,
                    MAX(CASE WHEN user_id = ${userId}::uuid THEN status ELSE NULL END) as my_status
                FROM post_likes
                WHERE post_id = ANY(${postIds.map(id => id)}::uuid[])
                AND deleted_at IS NULL
                GROUP BY post_id
            `
            : this.databaseService.sql`
                SELECT
                    post_id,
                    COUNT(CASE WHEN status = 'Like' THEN 1 END) as likes_count,
                    COUNT(CASE WHEN status = 'Dislike' THEN 1 END) as dislikes_count
                FROM post_likes
                WHERE post_id = ANY(${postIds.map(id => id)}::uuid[])
                AND deleted_at IS NULL
                GROUP BY post_id
            `;

        // Single query to get newest 3 likes for all posts
        const newestLikesQuery = this.databaseService.sql`
            SELECT post_id, added_at, user_id, login
            FROM (
                SELECT
                    post_id,
                    added_at,
                    user_id,
                    login,
                    ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY added_at DESC) as rn
                FROM post_likes
                WHERE post_id = ANY(${postIds.map(id => id)}::uuid[])
                AND status = 'Like'
                AND deleted_at IS NULL
            ) ranked
            WHERE rn <= 3
            ORDER BY post_id, added_at DESC
        `;

        const [stats, newestLikes] = await Promise.all([statsQuery, newestLikesQuery]);

        // Build a map of postId -> likes info
        const statsMap = new Map(
            stats.map(row => [
                row.post_id,
                {
                    likesCount: parseInt(row.likes_count, 10),
                    dislikesCount: parseInt(row.dislikes_count, 10),
                    myStatus: (row.my_status as "Like" | "Dislike") || "None"
                }
            ])
        );

        // Build a map of postId -> newest likes array
        const newestLikesMap = new Map<string, Array<{ addedAt: Date; userId: string; login: string; }>>();
        for (const like of newestLikes) {
            if (!newestLikesMap.has(like.post_id)) {
                newestLikesMap.set(like.post_id, []);
            }
            newestLikesMap.get(like.post_id)!.push({
                addedAt: like.added_at,
                userId: like.user_id,
                login: like.login
            });
        }

        // Combine into final result
        const result = new Map();
        for (const postId of postIds) {
            const stats = statsMap.get(postId);
            result.set(postId, {
                likesCount: stats?.likesCount || 0,
                dislikesCount: stats?.dislikesCount || 0,
                myStatus: stats?.myStatus || "None",
                newestLikes: newestLikesMap.get(postId) || []
            });
        }

        return result;
    }
}