import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blogs.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { BlogsSortBy } from '../../api/input-dto/blogs-sort-by';
import { SortDirection } from 'src/core/dto/base.query-params.input-dto';
import { DatabaseService } from 'src/modules/database/database.service';

@Injectable()
export class BlogsExternalQueryRepository {
  constructor(
      private databaseService: DatabaseService,
    ) {}
  
  private mapToBlog(row: any): Blog  {
    //if (!row) return null;

    return new Blog(
      row.id,
      row.name,
      row.description,
      row.website_url,
      row.is_membership || false,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const result = await this.databaseService.sql`
      SELECT * FROM blogs
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!result[0]) {
      throw new NotFoundException('Blog not found');
    }

    const mappedBlog = this.mapToBlog(result[0]);

    return BlogViewDto.mapToView(mappedBlog);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {

    const skip = query.calculateSkip();
    const limit = query.pageSize;

    // Build the WHERE conditions dynamically
    let whereClause = "deleted_at IS NULL";

    // Build search conditions - should be OR, not AND
    let searchConditions: string[] = [];

    if (query.searchNameTerm) {
      searchConditions.push(`name ILIKE '%${query.searchNameTerm}%'`);
    }

    if (query.searchDescriptionTerm) {
      searchConditions.push(`description ILIKE '%${query.searchDescriptionTerm}%'`)
    }

    if (searchConditions.length > 0) {
      whereClause += ` AND (${searchConditions.join(" OR ")})`;
    }

    // Build ORDER BY clause
    let orderByColumn = "created_at";
    switch (query.sortBy) {
      case BlogsSortBy.Name:
        orderByColumn = "name";
        break;
      case BlogsSortBy.Description:
        orderByColumn = "description";
        break;
      case BlogsSortBy.CreatedAt:
      default:
        orderByColumn = "created_at";
        break;
    }

    const orderDirection = query.sortDirection === SortDirection.Asc ? "ASC" : "DESC";

    // Get total count
    const countResult = await this.databaseService.sql`
      SELECT COUNT(*) as count FROM blogs
      WHERE ${this.databaseService.sql.unsafe(whereClause)}
    `;
    const totalCount = parseInt(countResult[0].count, 10);

    // Get paginated results
    const results = await this.databaseService.sql`
      SELECT * FROM blogs
      WHERE ${this.databaseService.sql.unsafe(whereClause)}
      ORDER BY ${this.databaseService.sql.unsafe(orderByColumn)} ${this.databaseService.sql.unsafe(orderDirection)}
      OFFSET ${skip}
      LIMIT ${limit}
    `;

    const items: Blog[] = [];

    for (const row of results) {
      const blog = this.mapToBlog(row);
      if (blog) {
        items.push(blog)
      }
    }

    const mappedItems = items.map(blog => BlogViewDto.mapToView(blog));

    return PaginatedViewDto.mapToView({
      items: mappedItems,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
