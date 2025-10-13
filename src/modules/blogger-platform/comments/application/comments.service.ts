import { Injectable } from "@nestjs/common";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { UpdateCommentDto } from "../dto/update-comment.dto";

@Injectable()
export class CommentsService {

  constructor(
    private commentsRepository: CommentsRepository,
    private commentLikesRepository: CommentsLikesRepository,
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
