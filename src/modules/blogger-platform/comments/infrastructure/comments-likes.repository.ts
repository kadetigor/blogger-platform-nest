import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CommentLike, CommentLikeModelType } from "../domain/comment-like.entity";

@Injectable()
export class CommentsLikesRepository {

    constructor(@InjectModel(CommentLike.name) private CommentLikeModel: CommentLikeModelType) {}

    async setLikeStatus(commentId: string, userId: string, status: "Like" | "Dislike" | "None"): Promise<void> {
        if (status === "None") {
            // Remove the like/dislike
            await this.CommentLikeModel.deleteOne({ commentId, userId });
            return;
        }

        // Upsert the like/dislike
        await this.CommentLikeModel.findOneAndUpdate(
            { commentId, userId },
            { 
                $set: { 
                    status,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    async getUserLikeStatus(commentId: string, userId: string): Promise<"Like" | "Dislike" | "None"> {
        const like = await this.CommentLikeModel.findOne({ commentId, userId });
        if (!like) {
            return "None"
        }
        return like.status as "Like" | "Dislike";
    }

    async getLikesCount(commentId: string): Promise<number> {
        return await this.CommentLikeModel.countDocuments({ commentId, status: "Like" });
    }

    async getDislikesCount(commentId: string): Promise<number> {
        return await this.CommentLikeModel.countDocuments({ commentId, status: "Dislike" });
    }

    async deleteAllLikesForComment(commentId: string): Promise<void> {
        await this.CommentLikeModel.deleteMany({ commentId });
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