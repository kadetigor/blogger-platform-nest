import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Comment, CommentDocument, CommentModelType } from "../../domain/comment.entity";
import { GetCommentsQueryParams } from "../../api/input-dto.ts/get-comments-query-params.input-dto";
import { CommentViewDto } from "../../api/view-dto.ts/comment.view-dto";
import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { FilterQuery, isValidObjectId } from "mongoose";
import { CommentsLikesRepository } from "../comments-likes.repository";
import { Post, PostModelType } from "../../../posts/domain/post.entity";

@Injectable()
export class CommentsExternalQueryRepository {

  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    @InjectModel(Post.name) private PostModel: PostModelType,
    private commentsLikesRepository: CommentsLikesRepository,
  ) { };

  async getCommentsForPost(postId: string, userId: string, query: GetCommentsQueryParams): Promise<PaginatedViewDto<CommentViewDto[]>> {
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
    
    const filter: FilterQuery<Comment> = {
          postId: postId,
          deletedAt: null,
        };

    const comments = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    const likesInfoMap = new Map<string, { likesCount: number; dislikesCount: number; myStatus: "None" | "Like" | "Dislike" }>();
        await Promise.all(
          comments.map(async (comment) => {
            const likesInfo = await this.commentsLikesRepository.getLikesInfo(comment._id.toString(), userId);
            likesInfoMap.set(comment._id.toString(), likesInfo);
          })
        );

    const items = comments.map(comment => {
      const likesInfo = likesInfoMap.get(comment._id.toString());
      return CommentViewDto.mapToView(comment, likesInfo!);
    });

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}