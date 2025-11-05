import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { CreateCommentInputDto } from "../api/input-dto.ts/create-comment.input-dto";
import { CommentViewDto } from "../api/view-dto.ts/comment.view-dto";
import { UpdateCommentDto } from "../dto/update-comment.dto";
import { PostsExternalQueryRepository } from "../../posts/infrastructure/external-query/posts.external-query-repository";

@Injectable()
export class CommentsExtertalService {

  constructor(
    private commentsRepository: CommentsRepository,
    private commentsLikesRepository: CommentsLikesRepository,
    private postsExternalQueryRepository: PostsExternalQueryRepository,
  ) { }

  async createComment(postId: string, dto: CreateCommentInputDto, user: {id: string, login: string}): Promise<CommentViewDto> {

    if (!user) {
        throw new UnauthorizedException('no user found')
      }

    // Check if post exists using the posts service
    try {
      await this.postsExternalQueryRepository.getPostById(postId);
    } catch (error) {
      throw new NotFoundException('post not found');
    }

    const comment = await this.commentsRepository.createComment({
      content: dto.content,
      commentatorUserId: user.id,
      commentatorUserLogin: user.login,
      postId: postId
    })

    const likesInfo = await this.commentsLikesRepository.getLikesInfo(comment.id, user.id);

    const commentViewModel = CommentViewDto.mapToView(comment, likesInfo);

    return commentViewModel;
  }

  async updateComment(id: string, dto: UpdateCommentDto): Promise<void> {
      await this.commentsRepository.updateComment(id, dto)
      return;
    }
}
