import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { CommentLike, CommentLikeStatus } from "../../domain/comment-like.entity";

@Injectable()
export class CommentsLikesExternalRepository {
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
}
