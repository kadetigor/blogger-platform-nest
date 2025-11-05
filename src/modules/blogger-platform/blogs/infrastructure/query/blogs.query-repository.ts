import { Injectable, NotFoundException } from '@nestjs/common';
import { Blog } from '../../domain/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blogs.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { BlogsSortBy } from '../../api/input-dto/blogs-sort-by';
import { SortDirection } from 'src/core/dto/base.query-params.input-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectRepository(Blog) private repository: Repository<Blog>,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this.repository.findOneBy({id});

    if (!blog) {
      throw new NotFoundException('blog not found')
    }

    return BlogViewDto.mapToView(blog)
  }

  async getAllBlogs(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const skip = query.calculateSkip();
    const limit = query.pageSize;

    let orderByColumn: keyof Blog = 'createdAt';
    switch (query.sortBy) {
      case BlogsSortBy.Name:
        orderByColumn = 'name';
        break;
      case BlogsSortBy.Description:
        orderByColumn = 'description'
        break;
      default:
        orderByColumn ='createdAt';
        break;
    }

    // Build the query with search filters
    const queryBuilder = this.repository.createQueryBuilder('blog');

    // Apply search filters if provided
    if (query.searchNameTerm) {
      queryBuilder.andWhere('blog.name ILIKE :nameTerm', {
        nameTerm: `%${query.searchNameTerm}%`
      });
    }

    if (query.searchDescriptionTerm) {
      queryBuilder.andWhere('blog.description ILIKE :descriptionTerm', {
        descriptionTerm: `%${query.searchDescriptionTerm}%`
      });
    }

    // Apply sorting
    queryBuilder.orderBy(
      `blog.${orderByColumn}`,
      query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC'
    );

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [blogs, totalCount] = await queryBuilder.getManyAndCount();

    return PaginatedViewDto.mapToView({
      items: blogs.map(blog => BlogViewDto.mapToView(blog)),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
