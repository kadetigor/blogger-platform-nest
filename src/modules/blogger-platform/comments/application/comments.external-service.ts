import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { CommentsLikesRepository } from "../infrastructure/comments-likes.repository";
import { CreateCommentInputDto } from "../api/input-dto.ts/create-comment.input-dto";
import { Comment, CommentModelType } from "../domain/comment.entity";
import { InjectModel } from "@nestjs/mongoose";
import { CommentViewDto } from "../api/view-dto.ts/comment.view-dto";
import { UpdateCommentDto } from "../dto/update-comment.dto";
import { Post, PostModelType } from "../../posts/domain/post.entity";
import { isValidObjectId } from "mongoose";

@Injectable()
export class CommentsExtertalService {

  constructor(
    private commentsRepository: CommentsRepository,
    private commentsLikesRepository: CommentsLikesRepository,
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    @InjectModel(Post.name) private PostModel: PostModelType,
  ) { }

  async createComment(postId: string, dto: CreateCommentInputDto, user: {id: string, login: string}): Promise<CommentViewDto> {

    if (!user) {
        throw new UnauthorizedException('no user found')
      }

    // Check if postId is valid and if post exists
    if (!isValidObjectId(postId)) {
      throw new NotFoundException('post not found');
    }
    
    const post = await this.PostModel.findOne({
      _id: postId,
      deletedAt: null,
    });
    
    if (!post) {
      throw new NotFoundException('post not found');
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
