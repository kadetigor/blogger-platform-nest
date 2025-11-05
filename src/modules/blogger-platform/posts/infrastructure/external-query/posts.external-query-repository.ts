import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PostsSortBy } from '../../api/input-dto/posts-sort-by';
import { SortDirection } from 'src/core/dto/base.query-params.input-dto';
import { PostLikeRepository } from '../posts-likes.repository';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostsExternalQueryRepository {
  constructor(
    @InjectRepository(Post) private repository: Repository<Post>,
    private postLikeRepository: PostLikeRepository,
  ) {}

  async getPostById(id: string, userId?: string): Promise<PostViewDto> {
    const post = await this.repository.findOneBy({
      id: id,
      deletedAt: IsNull()
    });

    if (!post) {
      throw new NotFoundException('post not found')
    }

    // Fetch actual likes info from database
    const likesInfo = await this.postLikeRepository.getExtendedLikesInfo(post.id, userId);

    return PostViewDto.mapToView(post, likesInfo);
  }

  async getAllPosts(
    query: GetPostsQueryParams,
    userId?: string,
  ) {
    const skip = query.calculateSkip();
    const limit = query.pageSize;

    let orderByColumn: keyof Post = 'createdAt';
    switch (query.sortBy) {
      case PostsSortBy.BlogName:
        orderByColumn = 'blogName';
        break;
      case PostsSortBy.ShortDescription:
        orderByColumn = 'shortDescription'
        break;
      case PostsSortBy.Title:
        orderByColumn = 'title';
        break;
      default:
        orderByColumn ='createdAt';
        break;
    }

    const [posts, totalCount] = await this.repository.findAndCount({
      order: {
        [orderByColumn]: query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC'
      },
      skip,
      take: limit
    });

    // Fetch likes info for all posts in a single batch query
    const postIds = posts.map(p => p.id);
    const likesInfoMap = await this.postLikeRepository.getBatchExtendedLikesInfo(postIds, userId);

    // Combine posts with their likes info
    const filteredItems = posts.map(post => {
      const likesInfo = likesInfoMap.get(post.id) || {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None' as const,
        newestLikes: []
      };
      return PostViewDto.mapToView(post, likesInfo);
    });

    return PaginatedViewDto.mapToView({
      items: filteredItems,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });

  }

  async getAllPostsByBlog(
    query: GetPostsQueryParams,
    blogId: string,
    userId?: string
  ): Promise<PaginatedViewDto<PostViewDto[]>>  {
    const skip = query.calculateSkip();
    const limit = query.pageSize;

    let orderByColumn: keyof Post = 'createdAt';
    switch (query.sortBy) {
      case PostsSortBy.BlogName:
        orderByColumn = 'blogName';
        break;
      case PostsSortBy.ShortDescription:
        orderByColumn = 'shortDescription'
        break;
      case PostsSortBy.Title:
        orderByColumn = 'title';
        break;
      default:
        orderByColumn ='createdAt';
        break;
    }

    const [posts, totalCount] = await this.repository.findAndCount({
      where: {blogId: blogId},
      order: {
        [orderByColumn]: query.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC'
      },
      skip,
      take: limit
    });

    // Fetch likes info for all posts in a single batch query
    const postIds = posts.map(p => p.id);
    const likesInfoMap = await this.postLikeRepository.getBatchExtendedLikesInfo(postIds, userId);

    // Combine posts with their likes info
    const filteredItems = posts.map(post => {
      const likesInfo = likesInfoMap.get(post.id) || {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None' as const,
        newestLikes: []
      };
      return PostViewDto.mapToView(post, likesInfo);
    });

    return PaginatedViewDto.mapToView({
      items: filteredItems,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });

  }
}
