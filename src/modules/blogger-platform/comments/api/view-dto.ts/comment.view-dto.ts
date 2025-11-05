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

  static mapToView(comment: CommentDocument, likes: CommentLikeViewDto): CommentViewDto {
    const dto = new CommentViewDto()

    dto.id = comment.id
    dto.content = comment.content
    dto.commentatorInfo = {
      userId: comment.commentatorUserId,
      userLogin: comment.commentatorUserLogin
    };
    dto.createdAt = comment.createdAt
    dto.likesInfo = likes;
    return dto
  }
}
