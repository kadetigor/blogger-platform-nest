import { Injectable } from "@nestjs/common";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { CreateCommentInputDto } from "../api/input-dto.ts/create-comment.input-dto";
import { UpdateCommentDto } from "../dto/update-comment.dto";
import { Comment, CommentModelType } from "../domain/comment.entity";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class CommentsService {

  constructor(
    private commentsRepository: CommentsRepository,
    private commentLikesRepository: CommentsLikesRepository,
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) { }

  async updateComment(id: string, dto: UpdateCommentDto): Promise<void> {
    await this.commentsRepository.updateComment(id, dto)
    return;
  }

  async removeComment(id: string): Promise<void> {
    await this.commentsRepository.removeComment(id);
    return;
  }

  async updateLikeInfo(commentId: string, userId: string, status: "Like" | "Dislike" | "None"): Promise<void> {
    // First check if comment exists
    await this.commentsRepository.findByIdOrFail(commentId);

    // Then update the like status
    await this.commentLikesRepository.setLikeStatus(commentId, userId, status);
  }
}
