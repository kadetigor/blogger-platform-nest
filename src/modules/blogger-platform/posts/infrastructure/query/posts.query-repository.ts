import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { FilterQuery, isValidObjectId } from 'mongoose';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PostLikeRepository } from '../posts-likes.repository';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private postLikeRepository: PostLikeRepository,
) {}

  async getPostById(id: string, userId?: string): Promise<PostViewDto> {
    const post = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!post) {
      throw new NotFoundException('post not found');
    }

    // Get likes info for this post
    const likesInfo = await this.postLikeRepository.getExtendedLikesInfo(
      post._id.toString(), 
      userId
    );

    return PostViewDto.mapToView(post, likesInfo);
  }

  async getAllPosts(
    query: GetPostsQueryParams,
    userId: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    const posts = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    // Get likes info for all posts
    const likesInfoMap = new Map();
    await Promise.all(
      posts.map(async (post) => {
        const likesInfo = await this.postLikeRepository.getExtendedLikesInfo(
          post._id.toString(),
          userId
        );
        likesInfoMap.set(post._id.toString(), likesInfo);
      })
    );

    const items = posts.map(post => {
      const likesInfo = likesInfoMap.get(post._id.toString());
      return PostViewDto.mapToView(post, likesInfo);
    });

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getAllPostsByBlog(
    query: GetPostsQueryParams,
    blogId: string,
    userId: string
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = {
      blogId: blogId,
      deletedAt: null,
    };

    const posts = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    // Get likes info for all posts
    const likesInfoMap = new Map();
    await Promise.all(
      posts.map(async (post) => {
        const likesInfo = await this.postLikeRepository.getExtendedLikesInfo(
          post._id.toString(),
          userId
        );
        likesInfoMap.set(post._id.toString(), likesInfo);
      })
    );

    const items = posts.map(post => {
      const likesInfo = likesInfoMap.get(post._id.toString());
      return PostViewDto.mapToView(post, likesInfo);
    });

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
