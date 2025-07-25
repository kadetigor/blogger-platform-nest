import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { PostsService } from '../application/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { ApiParam } from '@nestjs/swagger';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from './view-dto/post.view-dto';
import { CreatePostInputDto } from './input-dto/post.input-dto';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private postsQueryRepository: PostsQueryRepository,
  ) {
    console.log('PostsController created')
  }


  @Get()
  async findAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.getAllPosts(query);
  }

  @Post()
  async create(@Body() dto: CreatePostInputDto): Promise<PostViewDto> {
    return this.postsService.createPost(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostViewDto> {
    return this.postsQueryRepository.getPostById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Param('id') id: string, @Body() dto: CreatePostInputDto): Promise<void> {
    return this.postsService.updatePost(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.postsService.removePost(id);
  }
}
