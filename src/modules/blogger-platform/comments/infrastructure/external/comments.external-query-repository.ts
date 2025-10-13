import { Injectable, NotFoundException } from "@nestjs/common";
import { Comment } from "../../domain/comment.entity";
import { CommentatorInfo } from "../../domain/schemas/commentor-info.schema";
import { GetCommentsQueryParams } from "../../api/input-dto.ts/get-comments-query-params.input-dto";
import { CommentViewDto } from "../../api/view-dto.ts/comment.view-dto";
import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { CommentsLikesRepository } from "../comments-likes.repository";
import { PostsExternalQueryRepository } from "../../../posts/infrastructure/external-query/posts.external-query-repository";
import { DatabaseService } from "src/modules/database/database.service";
import { CommentsSortBy } from "../../api/input-dto.ts/comments-sort-by";
import { SortDirection } from "src/core/dto/base.query-params.input-dto";

@Injectable()
export class CommentsExternalQueryRepository {
  constructor(
    private databaseService: DatabaseService,
    private postsExternalQueryRepository: PostsExternalQueryRepository,
    private commentsLikesRepository: CommentsLikesRepository,
  ) {}

  private mapToComment(row: any): Comment | null {
    if (!row) return null;

    return new Comment(
      row.id,
      row.content,
      new CommentatorInfo(
        row.commentator_user_id,
        row.commentator_user_login
      ),
      row.post_id,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }

  async getCommentsForPost(postId: string, userId: string, query: GetCommentsQueryParams): Promise<PaginatedViewDto<CommentViewDto[]>> {
    // Check if post exists using the posts service
    try {
      await this.postsExternalQueryRepository.getPostById(postId);
    } catch (error) {
      throw new NotFoundException('post not found');
    }

    const skip = query.calculateSkip();
    const limit = query.pageSize;

    // Build ORDER BY clause
    let orderByColumn = "created_at";
    switch (query.sortBy) {
      case CommentsSortBy.CreatedAt:
      default:
        orderByColumn = "created_at";
        break;
    }
    const orderDirection = query.sortDirection === SortDirection.Asc ? "ASC" : "DESC";

    // Get total count
    const countResult = await this.databaseService.sql`
      SELECT COUNT(*) as count FROM comments
      WHERE post_id = ${postId}::uuid
      AND deleted_at IS NULL
    `;
    const totalCount = parseInt(countResult[0].count, 10);

    // Get paginated results
    const results = await this.databaseService.sql`
      SELECT * FROM comments
      WHERE post_id = ${postId}::uuid
      AND deleted_at IS NULL
      ORDER BY ${this.databaseService.sql.unsafe(orderByColumn)} ${this.databaseService.sql.unsafe(orderDirection)}
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    // Get likes info for all comments
    const likesInfoMap = new Map<string, { likesCount: number; dislikesCount: number; myStatus: "None" | "Like" | "Dislike" }>();
    await Promise.all(
      results.map(async (row) => {
        const likesInfo = await this.commentsLikesRepository.getLikesInfo(row.id, userId);
        likesInfoMap.set(row.id, likesInfo);
      })
    );

    const items = results.map(row => {
      const comment = this.mapToComment(row);
      if (!comment) return null;
      const likesInfo = likesInfoMap.get(row.id);
      return CommentViewDto.mapToView(comment, likesInfo!);
    }).filter(Boolean) as CommentViewDto[];

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}