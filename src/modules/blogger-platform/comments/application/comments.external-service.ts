import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { CreateCommentInputDto } from "../api/input-dto.ts/create-comment.input-dto";
import { Comment, CommentModelType } from "../domain/comment.entity";
import { InjectModel } from "@nestjs/mongoose";
import { CommentViewDto } from "../api/view-dto.ts/comment.view-dto";
import { UpdateCommentDto } from "../dto/update-comment.dto";

@Injectable()
export class CommentsExtertalService {

  constructor(
    private commentsRepository: CommentsRepository,
    private commentsLikesRepository: CommentsLikesRepository,
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) { }

  async createComment(postId: string, dto: CreateCommentInputDto, user: {id: string, login: string}): Promise<CommentViewDto> {

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

    const comment = await this.commentsRepository.createComment(newComment)

    const likesInfo = await this.commentsLikesRepository.getLikesInfo(comment.id, user.id);

    const commentViewModel = CommentViewDto.mapToView(comment, likesInfo);

    return commentViewModel;
  }

  async updateComment(id: string, dto: UpdateCommentDto): Promise<void> {
      await this.commentsRepository.updateComment(id, dto)
      return;
    }
}
