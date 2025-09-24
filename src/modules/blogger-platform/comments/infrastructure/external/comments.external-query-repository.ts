import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Comment, CommentDocument, CommentModelType } from "../../domain/comment.entity";
import { GetCommentsQueryParams } from "../../api/input-dto.ts/get-comments-query-params.input-dto";
import { CommentViewDto } from "../../api/view-dto.ts/comment.view-dto";
import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { FilterQuery } from "mongoose";
import { CommentsLikesRepository } from "../comments-likes.repository";
import { PostsExternalQueryRepository } from "../../../posts/infrastructure/external-query/posts.external-query-repository";

@Injectable()
export class CommentsExternalQueryRepository {

  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    private postsExternalQueryRepository: PostsExternalQueryRepository,
    private commentsLikesRepository: CommentsLikesRepository,
  ) { };

  async getCommentsForPost(postId: string, userId: string, query: GetCommentsQueryParams): Promise<PaginatedViewDto<CommentViewDto[]>> {
    // Check if post exists using the posts service
    try {
      await this.postsExternalQueryRepository.getPostById(postId);
    } catch (error) {
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