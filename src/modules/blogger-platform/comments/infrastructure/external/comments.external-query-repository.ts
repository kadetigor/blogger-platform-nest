import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Comment } from "../../domain/comment.entity";
import { GetCommentsQueryParams } from "../../api/input-dto.ts/get-comments-query-params.input-dto";
import { CommentViewDto } from "../../api/view-dto.ts/comment.view-dto";
import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { CommentsLikesRepository } from "../comments-likes.repository";
import { PostsExternalQueryRepository } from "../../../posts/infrastructure/external-query/posts.external-query-repository";
import { CommentsSortBy } from "../../api/input-dto.ts/comments-sort-by";
import { SortDirection } from "src/core/dto/base.query-params.input-dto";

@Injectable()
export class CommentsExternalQueryRepository {
  constructor(
    @InjectRepository(Comment) private repository: Repository<Comment>,
    private postsExternalQueryRepository: PostsExternalQueryRepository,
    private commentsLikesRepository: CommentsLikesRepository,
  ) {}

  async getCommentsForPost(postId: string, userId: string, query: GetCommentsQueryParams): Promise<PaginatedViewDto<CommentViewDto[]>> {
    // Check if post exists using the posts service
    try {
      await this.postsExternalQueryRepository.getPostById(postId);
    } catch (error) {
      throw new NotFoundException('post not found');
    }

    const skip = query.calculateSkip();
    const limit = query.pageSize;

    // Build ORDER BY
    let orderByField: keyof Comment = "createdAt";
    switch (query.sortBy) {
      case CommentsSortBy.CreatedAt:
      default:
        orderByField = "createdAt";
        break;
    }
    const orderDirection = query.sortDirection === SortDirection.Asc ? "ASC" : "DESC";

    // Get total count
    const totalCount = await this.repository.count({
      where: {
        postId,
        deletedAt: IsNull()
      }
    });

    // Get paginated results
    const comments = await this.repository.find({
      where: {
        postId,
        deletedAt: IsNull()
      },
      order: {
        [orderByField]: orderDirection
      },
      skip,
      take: limit
    });

    // Get likes info for all comments
    const likesInfoMap = new Map<string, { likesCount: number; dislikesCount: number; myStatus: "None" | "Like" | "Dislike" }>();
    await Promise.all(
      comments.map(async (comment) => {
        const likesInfo = await this.commentsLikesRepository.getLikesInfo(comment.id, userId);
        likesInfoMap.set(comment.id, likesInfo);
      })
    );

    const items = comments.map(comment => {
      const likesInfo = likesInfoMap.get(comment.id);
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
