import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, In } from "typeorm";
import { PostLike, LikeStatus } from "../domain/post-like.entity";

@Injectable()
export class PostLikeRepository {
    constructor(@InjectRepository(PostLike) private repository: Repository<PostLike>) {}

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
            await this.repository.softDelete({
                postId,
                userId,
            });
            return;
        }

        // Check if a like/dislike already exists
        const existing = await this.repository.findOne({
            where: {
                postId,
                userId,
                deletedAt: IsNull()
            }
        });

        if (existing) {
            // Update existing like/dislike
            existing.status = status as LikeStatus;
            existing.addedAt = new Date();
            existing.login = userLogin;
            await this.repository.save(existing);
        } else {
            // Insert new like/dislike
            const newLike = this.repository.create({
                postId,
                userId,
                status: status as LikeStatus,
                addedAt: new Date(),
                login: userLogin
            });
            await this.repository.save(newLike);
        }
    }

    async getUserLikeStatus(postId: string, userId: string): Promise<"Like" | "Dislike" | "None"> {
        const result = await this.repository.findOne({
            where: {
                postId,
                userId,
                deletedAt: IsNull()
            }
        });

        if (!result) {
            return "None";
        }
        return result.status as "Like" | "Dislike";
    }

    async getLikesCount(postId: string): Promise<number> {
        return await this.repository.count({
            where: {
                postId,
                status: LikeStatus.LIKE,
                deletedAt: IsNull()
            }
        });
    }

    async getDislikesCount(postId: string): Promise<number> {
        return await this.repository.count({
            where: {
                postId,
                status: LikeStatus.DISLIKE,
                deletedAt: IsNull()
            }
        });
    }

    async deleteAllLikesForPost(postId: string): Promise<void> {
        await this.repository.softDelete({ postId });
    }

    async findNewestLikes(postId: string): Promise<Array<{
        addedAt: Date;
        userId: string;
        login: string;
    }>> {
        const results = await this.repository.find({
            where: {
                postId,
                status: LikeStatus.LIKE,
                deletedAt: IsNull()
            },
            order: {
                addedAt: 'DESC'
            },
            take: 3
        });

        return results.map(like => ({
            addedAt: like.addedAt,
            userId: like.userId,
            login: like.login
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

        // Get all likes for the given posts
        const allLikes = await this.repository.find({
            where: {
                postId: In(postIds),
                deletedAt: IsNull()
            }
        });

        // Get newest likes for each post
        const newestLikesQuery = this.repository
            .createQueryBuilder('pl')
            .select([
                'pl.postId as post_id',
                'pl.addedAt as added_at',
                'pl.userId as user_id',
                'pl.login as login'
            ])
            .where('pl.postId IN (:...postIds)', { postIds })
            .andWhere('pl.status = :status', { status: LikeStatus.LIKE })
            .andWhere('pl.deletedAt IS NULL')
            .orderBy('pl.postId', 'ASC')
            .addOrderBy('pl.addedAt', 'DESC');

        const newestLikesRaw = await newestLikesQuery.getRawMany();

        // Build a map of postId -> newest likes array (limit to 3 per post)
        const newestLikesMap = new Map<string, Array<{ addedAt: Date; userId: string; login: string; }>>();
        for (const like of newestLikesRaw) {
            if (!newestLikesMap.has(like.post_id)) {
                newestLikesMap.set(like.post_id, []);
            }
            const likesArray = newestLikesMap.get(like.post_id)!;
            if (likesArray.length < 3) {
                likesArray.push({
                    addedAt: like.added_at,
                    userId: like.user_id,
                    login: like.login
                });
            }
        }

        // Build stats map from all likes
        const statsMap = new Map<string, {
            likesCount: number;
            dislikesCount: number;
            myStatus: "Like" | "Dislike" | "None";
        }>();

        // Group likes by postId
        const likesByPost = new Map<string, PostLike[]>();
        for (const like of allLikes) {
            if (!likesByPost.has(like.postId)) {
                likesByPost.set(like.postId, []);
            }
            likesByPost.get(like.postId)!.push(like);
        }

        // Calculate stats for each post
        for (const postId of postIds) {
            const likes = likesByPost.get(postId) || [];
            const likesCount = likes.filter(l => l.status === LikeStatus.LIKE).length;
            const dislikesCount = likes.filter(l => l.status === LikeStatus.DISLIKE).length;
            const userLike = userId ? likes.find(l => l.userId === userId) : null;
            const myStatus = userLike ? (userLike.status as "Like" | "Dislike") : "None";

            statsMap.set(postId, {
                likesCount,
                dislikesCount,
                myStatus
            });
        }

        // Combine into final result
        const result = new Map();
        for (const postId of postIds) {
            const stats = statsMap.get(postId) || { likesCount: 0, dislikesCount: 0, myStatus: "None" as const };
            result.set(postId, {
                likesCount: stats.likesCount,
                dislikesCount: stats.dislikesCount,
                myStatus: stats.myStatus,
                newestLikes: newestLikesMap.get(postId) || []
            });
        }

        return result;
    }
}
