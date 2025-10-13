import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  HttpStatus,
  HttpCode,
  Req,
  UnauthorizedException,
  UseGuards,
  UseFilters,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from '../application/posts.service';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from './view-dto/post.view-dto';
import { CreatePostInputDto } from './input-dto/post.input-dto';
import { RequestWithUser } from 'types/custom-request.interface';
import { CommentsExternalQueryRepository } from '../../comments/infrastructure/external/comments.external-query-repository';
import { CommentViewDto } from '../../comments/api/view-dto.ts/comment.view-dto';
import { CommentsExtertalService } from '../../comments/application/comments.external-service';
import { CreateCommentInputDto } from '../../comments/api/input-dto.ts/create-comment.input-dto';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt.auth-guard';
import { ValidationExceptionFilter } from 'src/core/filters/validation-exception.filter';
import { GetCommentsQueryParams } from '../../comments/api/input-dto.ts/get-comments-query-params.input-dto';
import { UpdateCommentDto } from '../../comments/dto/update-comment.dto';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basic.auth-guard';
import { PostLikeRepository } from '../infrastructure/posts-likes.repository';
import { LikeStatusUpdateDto } from './input-dto/like-status-update-dto';
import { JwtOptionalAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt.optional-auth-guard';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private postsQueryRepository: PostsQueryRepository,
    private commentsExternalQueryRepository: CommentsExternalQueryRepository,
    private commentsExternalService: CommentsExtertalService,
    private postsLikesRepository: PostLikeRepository,
  ) {
    console.log('PostsController created');
  }
  @Put(':postId/comments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateCommentForPost(
    @Param('postId') postId: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateCommentDto
  ): Promise<void> {
    return this.commentsExternalService.updateComment(postId, dto)
  }

  @Get(':postId/comments')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const userId = req.user?.id as string;

    return this.commentsExternalQueryRepository.getCommentsForPost(postId, userId, query)
  }

  @Post(':postId/comments')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseFilters(ValidationExceptionFilter)
  async createCommentUnderPost(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentInputDto,
    @Req() req: RequestWithUser,
  ): Promise <CommentViewDto> {
    const user = req.user;

    return this.commentsExternalService.createComment(postId, dto, user!)
  }

  @Put(':postId/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseFilters(ValidationExceptionFilter)
  async updatePostLikeStatus(
    @Param('postId') postId: string,
    @Body() likeStatus: LikeStatusUpdateDto,
    @Req() req: RequestWithUser
  ): Promise<void> {
    const userId = req.user?.id
    const userLogin = req.user?.login as string

    if(!await this.postsQueryRepository.getPostById(postId)){
      throw new NotFoundException('post does not exist')
    }

    await this.postsLikesRepository.setLikeStatus(postId, userId!, likeStatus.likeStatus, userLogin)
    return
  }

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async findAll(
    @Query() query: GetPostsQueryParams,
    @Req() req: RequestWithUser,
  ): Promise < PaginatedViewDto < PostViewDto[] >> {
    const userId = req.user?.id;
    return this.postsQueryRepository.getAllPosts(query, userId);
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async create(@Body() dto: CreatePostInputDto): Promise < PostViewDto > {
    return this.postsService.createPost(dto);
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<PostViewDto> {
    const userId = req.user?.id;
    return this.postsQueryRepository.getPostById(id, userId);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() dto: CreatePostInputDto,
  ): Promise < void> {
    return this.postsService.updatePost(id, dto);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise < void> {
    return this.postsService.removePost(id);
  }
}
