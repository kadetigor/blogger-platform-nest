import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CommentLike, CommentLikeModelType } from "../../domain/comment-like.entity";

@Injectable()
export class CommentsLikesExternalRepository {

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
}