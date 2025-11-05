import { Injectable } from '@nestjs/common';
import { Post } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { BlogsExternalQueryRepository } from '../../blogs/infrastructure/external-query/blogs.external-query-repository';
import { CreatePostInputDto } from '../api/input-dto/post.input-dto';
import { PostViewDto } from '../api/view-dto/post.view-dto';

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepository,
    private blogsExternalQueryRepository: BlogsExternalQueryRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<PostViewDto> {
    const blog = await this.blogsExternalQueryRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );

    const post = await this.postsRepository.createPost(dto);

    return post
  }

  async updatePost(id: string, dto: CreatePostInputDto): Promise<void> {
    const result = await this.postsRepository.updatePost(id, dto);
    return result;
  }

  async removePost(id: string): Promise<void> {
    await this.postsRepository.deletePost(id);
    return;
  }
}
