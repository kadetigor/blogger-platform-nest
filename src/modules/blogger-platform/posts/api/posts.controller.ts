import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Query } from '@nestjs/common';
import { PostsService } from '../application/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { ApiParam } from '@nestjs/swagger';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from './view-dto/post.view-dto';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private postsQueryRepository: PostsQueryRepository,
  ) {
    console.log('PostsController created')
  }

  @ApiParam({ name: 'id' })

  @Get()
  async findAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.getAllPosts(query);
  }

  @Post()
  async create(@Body() dto: CreatePostDto): Promise<string> {
    return this.postsService.createPost(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostViewDto> {
    return this.postsQueryRepository.getPostById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreatePostDto): Promise<void> {
    return this.postsService.updatePost(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.postsService.removePost(id);
  }
}
