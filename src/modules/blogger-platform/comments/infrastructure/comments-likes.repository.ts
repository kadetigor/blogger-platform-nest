import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { CommentLike, CommentLikeStatus } from "../domain/comment-like.entity";

@Injectable()
export class CommentsLikesRepository {
    constructor(@InjectRepository(CommentLike) private repository: Repository<CommentLike>) {}

    async setLikeStatus(commentId: string, userId: string, status: "Like" | "Dislike" | "None"): Promise<void> {
        if (status === "None") {
            // Remove the like/dislike (soft delete)
            await this.repository.softDelete({
                commentId,
                userId
            });
            return;
        }

        // Check if a like/dislike already exists
        const existing = await this.repository.findOne({
            where: {
                commentId,
                userId,
                deletedAt: IsNull()
            }
        });

        if (existing) {
            // Update existing like/dislike
            existing.status = status as CommentLikeStatus;
            await this.repository.save(existing);
        } else {
            // Insert new like/dislike
            const newLike = this.repository.create({
                commentId,
                userId,
                status: status as CommentLikeStatus
            });
            await this.repository.save(newLike);
        }
    }

    async getUserLikeStatus(commentId: string, userId: string): Promise<"Like" | "Dislike" | "None"> {
        const result = await this.repository.findOne({
            where: {
                commentId,
                userId,
                deletedAt: IsNull()
            }
        });

        if (!result) {
            return "None";
        }
        return result.status as "Like" | "Dislike";
    }

    async getLikesCount(commentId: string): Promise<number> {
        return await this.repository.count({
            where: {
                commentId,
                status: CommentLikeStatus.LIKE,
                deletedAt: IsNull()
            }
        });
    }

    async getDislikesCount(commentId: string): Promise<number> {
        return await this.repository.count({
            where: {
                commentId,
                status: CommentLikeStatus.DISLIKE,
                deletedAt: IsNull()
            }
        });
    }

    async deleteAllLikesForComment(commentId: string): Promise<void> {
        await this.repository.softDelete({ commentId });
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
