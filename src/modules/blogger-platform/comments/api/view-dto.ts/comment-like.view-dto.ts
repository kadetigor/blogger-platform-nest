import { CommentLikeDocument } from "../../domain/comment-like.entity";

export class CommentLikeViewDto {
    commentId: string;
    userId: string;
    status: string;
    createdAt: Date;
}