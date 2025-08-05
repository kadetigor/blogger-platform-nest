import { Injectable, UnauthorizedException } from "@nestjs/common";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { CreateCommentInputDto } from "../api/input-dto.ts/create-comment.input-dto";
import { Comment, CommentDocument, CommentModelType } from "../domain/comment.entity";
import { InjectModel } from "@nestjs/mongoose";
import { CommentViewDto } from "../api/view-dto.ts/comment.view-dto";

@Injectable()
export class CommentsExtertalService {

  constructor(
    private commentsRepository: CommentsRepository,
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) { }

  async createComment(postId: string, dto: CreateCommentInputDto, user: {id: string, login: string}): Promise<CommentDocument> {

    if (!user) {
        throw new UnauthorizedException('no user found')
      }

    const newComment = {
      content: dto.content,
      commentatorInfo: {
        userId: user.id,
        userLogin: user.login,
      },
      postId: postId,
      createdAt: new Date(),
      deletedAt: null
    };

    return this.commentsRepository.createComment(newComment);
  }
}
