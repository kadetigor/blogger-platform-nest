import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { BlogsQueryRepository } from "../infrastructure/query/blogs.query-repository";
import { BlogsRepository } from "../infrastructure/blogs.repository";
import { ApiParam } from "@nestjs/swagger";
import { BlogViewDto } from "./view-dto/blogs.view-dto";
import { GetBlogsQueryParams } from "./input-dto/get-blogs-query-params.input-dto";
import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { CreateBlogDto, UpdateBlogDto } from "../dto/create-blog.dto";
import { CreateBlogInputDto } from "./input-dto/blogs.input-dto";
import { BlogsService } from "../application/blogs.service";
import { UpdateBlogInputDto } from "./input-dto/update-blog.input-dto";


@Controller()
export class BlogsController {

    constructor(
        private blogsQueryRepository: BlogsQueryRepository,
        private blogsService: BlogsService,
    ) {
        console.log('BlogsController created')
    }

    @ApiParam({ name: 'id' })
    @Get(':id')
    async getById(@Param('id') id: string): Promise<BlogViewDto> {
        return this.blogsQueryRepository.getByIdOrNotFoundFail(id)
    }

    @Get()
    async getAll(
        @Query() query: GetBlogsQueryParams,
    ): Promise<PaginatedViewDto<BlogViewDto[]>> {
        return this.blogsQueryRepository.getAll(query)
    }

    @Post()
    async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
        const blogId = await this.blogsService.createBlog(body)
        return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId)
    }

    @Put(':id')
    async updateBlog(@Param('id') id: string, @Body() body: UpdateBlogInputDto): Promise<BlogViewDto> {
        const blogId = await this.blogsService.updateBlog(id, body)
        return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId.id);
    }

    @Delete(':id')
    async deleteBlog(@Param('id') id: string): Promise<void> {
        await this.blogsService.deleteBlog(id)
    }

}