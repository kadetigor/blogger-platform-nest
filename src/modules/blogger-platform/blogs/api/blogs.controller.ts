import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from "@nestjs/common";
import { BlogsQueryRepository } from "../infrastructure/query/blogs.query-repository";
import { ApiParam } from "@nestjs/swagger";
import { BlogViewDto } from "./view-dto/blogs.view-dto";
import { GetBlogsQueryParams } from "./input-dto/get-blogs-query-params.input-dto";
import { PaginatedViewDto } from "src/core/dto/base.paginated.view-dto";
import { CreateBlogInputDto } from "./input-dto/blogs.input-dto";
import { BlogsService } from "../application/blogs.service";
import { UpdateBlogInputDto } from "./input-dto/update-blog.input-dto";
import { PostViewDto } from "../../posts/api/view-dto/post.view-dto";
import { PostsExternalQueryRepository } from "../../posts/infrastructure/external-query/posts.external-query-repository";
import { GetPostsQueryParams } from "../../posts/api/input-dto/get-posts-query-params.input-dto";
import { PostsExternalService } from "../../posts/application/posts.external-service";
import { CreatePostDto } from "../../posts/dto/create-post.dto";


@Controller('blogs')
export class BlogsController {

    constructor(
        private blogsQueryRepository: BlogsQueryRepository,
        private blogsService: BlogsService,
        private postsExternalQueryRepository: PostsExternalQueryRepository,
        private postsExternalService: PostsExternalService,
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
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateBlog(@Param('id') id: string, @Body() body: UpdateBlogInputDto): Promise<BlogViewDto> {
        const blogId = await this.blogsService.updateBlog(id, body)
        return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBlog(@Param('id') id: string): Promise<void> {
        await this.blogsService.deleteBlog(id)
    }

    @Get(':id/posts')
    async getPostsByBlog(
        @Param('id') blogId: string,
        @Query() query: GetPostsQueryParams,
    ): Promise<PaginatedViewDto<PostViewDto[]>> {
        await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
        const result = await this.postsExternalQueryRepository.getAllPostsByBlog(query, blogId)
        return result
    }

    @Post(':id/posts')
    async createPostForBlog(@Param('id') blogId: string, @Body() body: CreatePostDto): Promise<PostViewDto> {
        const result = await this.postsExternalService.createPostForBlog(blogId, body)
        return result
    }
}