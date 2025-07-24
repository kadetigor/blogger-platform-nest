import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Blog, BlogModelType } from "../../domain/blog.entity";
import { BlogViewDto } from "../../api/view-dto/blogs.view-dto";
import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { FilterQuery } from "mongoose";
import { GetBlogsQueryParams } from "../../api/input-dto/get-blogs-query-params.input-dto";


@Injectable()
export class BlogsExternalQueryRepository {

    constructor(
        @InjectModel(Blog.name)
        private BlogModel: BlogModelType
    ) {}

    async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
        const blog = await this.BlogModel.findOne({
          _id: id,
          deletedAt: null,
        });
    
        if (!blog) {
          throw new NotFoundException('user not found');
        }
    
        return BlogViewDto.mapToView(blog);
      }
    
      async getAll(
        query: GetBlogsQueryParams,
      ): Promise<PaginatedViewDto<BlogViewDto[]>> {
        const filter: FilterQuery<Blog> = {
          deletedAt: null,
        };
    
        if (query.searchNameTerm) {
          filter.$or = filter.$or || [];
          filter.$or.push({
            login: { $regex: query.searchNameTerm, $options: 'i' },
          });
        }
    
        if (query.searchDescriptionTerm) {
          filter.$or = filter.$or || [];
          filter.$or.push({
            email: { $regex: query.searchDescriptionTerm, $options: 'i' },
          });
        }
    
        const blog = await this.BlogModel.find(filter)
          .sort({ [query.sortBy]: query.sortDirection })
          .skip(query.calculateSkip())
          .limit(query.pageSize);
    
        const totalCount = await this.BlogModel.countDocuments(filter);
    
        const items = blog.map(BlogViewDto.mapToView);
    
        return PaginatedViewDto.mapToView({
          items,
          totalCount,
          page: query.pageNumber,
          size: query.pageSize,
        });
      }
}