import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { ApiParam } from '@nestjs/swagger';
import { BlogViewDto } from './view-dto/blogs.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { CreateBlogInputDto } from './input-dto/blogs.input-dto';
import { BlogsService } from '../application/blogs.service';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/post.view-dto';
import { PostsExternalQueryRepository } from '../../posts/infrastructure/external-query/posts.external-query-repository';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { PostsExternalService } from '../../posts/application/posts.external-service';
import { CreatePostDto } from '../../posts/dto/create-post.dto';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic.auth-guard';
import { CreatePostInputDto } from '../../posts/api/input-dto/post.input-dto';

@Controller('sa/blogs')
@UseGuards(BasicAuthGuard)
export class SaBlogsController {
  constructor(
    private blogsQueryRepository: BlogsQueryRepository,
    private blogsService: BlogsService,
    private postsExternalQueryRepository: PostsExternalQueryRepository,
    private postsExternalService: PostsExternalService,
  ) {
    console.log('SaBlogsController created');
  }

  @Get()
  async getBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAllBlogs(query);
  }

  @Post()
  async createBlog(@Body() dto: CreateBlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.blogsService.createBlog(dto);
    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  async getBlogById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', required: true })
  async updateBlog(
    @Param('id') id: string,
    @Body() dto: UpdateBlogInputDto,
  ): Promise<void> {
    await this.blogsService.updateBlog(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', required: true })
  async deleteBlog(@Param('id') id: string): Promise<void> {
    await this.blogsService.deleteBlog(id);
  }

  // Posts for specific blog - SA endpoints
  @Get(':blogId/posts')
  @ApiParam({ name: 'blogId', required: true })
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsExternalQueryRepository.getAllPostsByBlog(query, blogId);
  }

  @Post(':blogId/posts')
  @ApiParam({ name: 'blogId', required: true })
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Body() dto: CreatePostInputDto,
  ): Promise<PostViewDto> {
    return this.postsExternalService.createPostForBlog(blogId, dto);
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'blogId', required: true })
  @ApiParam({ name: 'postId', required: true })
  async updatePostForBlog(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() dto: CreatePostDto,
  ): Promise<void> {
    await this.postsExternalService.updatePostForBlog(blogId, postId, dto);
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'blogId', required: true })
  @ApiParam({ name: 'postId', required: true })
  async deletePostForBlog(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    await this.postsExternalService.deletePostForBlog(blogId, postId);
  }
}