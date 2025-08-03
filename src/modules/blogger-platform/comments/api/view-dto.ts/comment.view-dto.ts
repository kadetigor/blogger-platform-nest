import { CommentLikeDocument } from "../../domain/comment-like.entity";
import { CommentDocument } from "../../domain/comment.entity";
import { CommentLikeViewDto } from "./comment-like.view-dto";

export class CommentViewDto {
    id: string;
    content: string;
    commentatorInfo: {
        userId: string;
        userLogin: string;
    }
    createdAt: Date;
    likesInfo: CommentLikeViewDto;

    static mapToView(comment: CommentDocument, likes: CommentLikeDocument): CommentViewDto {
        const dto = new CommentViewDto()

        dto.id = comment._id.toString()
        dto.content = comment.content
        dto.commentatorInfo.userId = comment.commentatorInfo.userId
        dto.createdAt = comment.createdAt
        dto.likesInfo.commentId = likes.id
        dto.likesInfo.userId = likes.userId
        dto.likesInfo.status = likes.status
        dto.likesInfo.createdAt = likes.createdAt
        
        return dto
    }
}