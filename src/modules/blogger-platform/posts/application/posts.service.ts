import { Injectable } from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
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
    // Fetch the blog to get its name
    const blog = await this.blogsExternalQueryRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );

    const post = Post.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
    }, dto.blogId, blog.name);

    return this.postsRepository.createPost(post);
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
