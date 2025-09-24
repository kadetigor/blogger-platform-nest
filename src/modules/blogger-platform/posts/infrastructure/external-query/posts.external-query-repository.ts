import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { DatabaseService } from 'src/modules/database/database.service';
import { PostsSortBy } from '../../api/input-dto/posts-sort-by';
import { SortDirection } from 'src/core/dto/base.query-params.input-dto';

@Injectable()
export class PostsExternalQueryRepository {
  constructor(
    private databaseService: DatabaseService,
  ) {}

  private mapToPost(row: any): Post | null {
    if (!row) return null;

    return new Post(
      row.id,
      row.title,
      row.short_description,
      row.content,
      row.blog_id,
      row.blog_name,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }
  async getPostById(id: string, userId?: string): Promise<PostViewDto> {
    const result = await this.databaseService.sql`
      SELECT * FROM posts
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!result[0]) {
      throw new NotFoundException('post not found');
    }

    const post = this.mapToPost(result[0]);
    if (!post) {
      throw new NotFoundException('post not found');
    }

    // Return with default likes info as per instructions
    const likesInfo = {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: 'None' as const,
      newestLikes: []
    };

    return PostViewDto.mapToView(post, likesInfo);
  }

  async getAllPosts(
    query: GetPostsQueryParams,
    userId?: string
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const skip = query.calculateSkip();
    const limit = query.pageSize;

    // Build WHERE conditions
    let whereClause = "deleted_at IS NULL";

    // Build ORDER BY clause
    let orderByColumn = "created_at";
    switch (query.sortBy) {
      case PostsSortBy.Title:
        orderByColumn = "title";
        break;
      case PostsSortBy.ShortDescription:
        orderByColumn = "short_description";
        break;
      case PostsSortBy.BlogName:
        orderByColumn = "blog_name";
        break;
      case PostsSortBy.CreatedAt:
      default:
        orderByColumn = "created_at";
        break;
    }
    const orderDirection = query.sortDirection === SortDirection.Asc ? "ASC" : "DESC";

    // Get total count
    const countResult = await this.databaseService.sql`
      SELECT COUNT(*) as count FROM posts
      WHERE ${this.databaseService.sql.unsafe(whereClause)}
    `;
    const totalCount = parseInt(countResult[0].count, 10);

    // Get paginated results
    const results = await this.databaseService.sql`
      SELECT * FROM posts
      WHERE ${this.databaseService.sql.unsafe(whereClause)}
      ORDER BY ${this.databaseService.sql.unsafe(orderByColumn)} ${this.databaseService.sql.unsafe(orderDirection)}
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    // Default likes info for all posts
    const likesInfo = {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: 'None' as const,
      newestLikes: []
    };

    const items = results.map(row => {
      const post = this.mapToPost(row);
      if (!post) return null;
      return PostViewDto.mapToView(post, likesInfo);
    }).filter(Boolean) as PostViewDto[];

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getAllPostsByBlog(
    query: GetPostsQueryParams,
    blogId: string,
    userId?: string
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const skip = query.calculateSkip();
    const limit = query.pageSize;

    // Build WHERE conditions
    let whereClause = "deleted_at IS NULL AND blog_id = '" + blogId + "'::uuid";

    // Build ORDER BY clause
    let orderByColumn = "created_at";
    switch (query.sortBy) {
      case PostsSortBy.Title:
        orderByColumn = "title";
        break;
      case PostsSortBy.ShortDescription:
        orderByColumn = "short_description";
        break;
      case PostsSortBy.BlogName:
        orderByColumn = "blog_name";
        break;
      case PostsSortBy.CreatedAt:
      default:
        orderByColumn = "created_at";
        break;
    }
    const orderDirection = query.sortDirection === SortDirection.Asc ? "ASC" : "DESC";

    // Get total count
    const countResult = await this.databaseService.sql`
      SELECT COUNT(*) as count FROM posts
      WHERE ${this.databaseService.sql.unsafe(whereClause)}
    `;
    const totalCount = parseInt(countResult[0].count, 10);

    // Get paginated results
    const results = await this.databaseService.sql`
      SELECT * FROM posts
      WHERE ${this.databaseService.sql.unsafe(whereClause)}
      ORDER BY ${this.databaseService.sql.unsafe(orderByColumn)} ${this.databaseService.sql.unsafe(orderDirection)}
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    // Default likes info for all posts
    const likesInfo = {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: 'None' as const,
      newestLikes: []
    };

    const items = results.map(row => {
      const post = this.mapToPost(row);
      if (!post) return null;
      return PostViewDto.mapToView(post, likesInfo);
    }).filter(Boolean) as PostViewDto[];

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
