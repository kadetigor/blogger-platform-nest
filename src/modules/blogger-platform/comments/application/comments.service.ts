import { Injectable } from "@nestjs/common";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { CreateCommentInputDto } from "../api/input-dto.ts/create-comment.input-dto";

@Injectable()
export class CommentsService {

  constructor(
    private commentsRepository: CommentsRepository,
    private commentLikesRepository: CommentsLikesRepository,
  ) {}

  async createComment(dto: CreateCommentInputDto): Promise<string> {

    const newComment: Comment = {
      content: dto.content,
      commentatorInfo: {
        userId: dto.userId,
        userLogin: dto.userLogin,
      },
      postId: dto.postId,
      createdAt: new Date()
    };
    return this.commentsRepository.create(newComment);
  }

  async update(id: string, dto: commentUpdateDto): Promise<void> {
    await this.commentsRepository.update(id, dto)
    return;
  }

  async delete(id: string): Promise<void> {
    await this.commentsRepository.delete(id);
    return;
  }

  async updateLikeInfo(commentId: string, userId: string, status: "Like" | "Dislike" | "None"): Promise<void> {
    // First check if comment exists
    await this.commentsRepository.findByIdOrFail(commentId);
    
    // Then update the like status
    await this.commentLikesRepository.setLikeStatus(commentId, userId, status);
  }
}