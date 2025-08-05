import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { CreateCommentInputDto } from "../api/input-dto.ts/create-comment.input-dto";
import { Comment, CommentModelType } from "../domain/comment.entity";
import { InjectModel } from "@nestjs/mongoose";
import { CommentViewDto } from "../api/view-dto.ts/comment.view-dto";
import { PostsExternalQueryRepository } from "../../posts/infrastructure/external-query/posts.external-query-repository";

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

    const createdComment = await this.commentsRepository.findByIdOrFail(comment.id);

    const likesInfo = await this.commentsLikesRepository.getLikesInfo(createdComment.id, user.id);

    const commentViewModel = CommentViewDto.mapToView(createdComment, likesInfo);

    return commentViewModel;
  }
}
