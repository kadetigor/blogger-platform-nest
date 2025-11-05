import { Injectable } from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { Post } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { BlogsExternalQueryRepository } from '../../blogs/infrastructure/external-query/blogs.external-query-repository';
import { CreatePostInputDto } from '../api/input-dto/post.input-dto';
import { PostViewDto } from '../api/view-dto/post.view-dto';

@Injectable()
export class PostsExternalService {
  constructor(
    private postsRepository: PostsRepository,
    private blogsExternalQueryRepository: BlogsExternalQueryRepository,
  ) {}

  async createPostForBlog(
    blogId: string,
    dto: CreatePostInputDto,
  ): Promise<PostViewDto> {
    // Fetch the blog to get its name
    const blog =
      await this.blogsExternalQueryRepository.getByIdOrNotFoundFail(blogId);

    if (!blog) {
      throw new Error();
    }

    dto.blogName = blog.name;
    dto.blogId = blogId; 

    const result = await this.postsRepository.createPost(dto);

    return result;
  }

  async updatePost(id: string, dto: CreatePostInputDto): Promise<void> {
    const result = await this.postsRepository.updatePost(id, dto);
    return result;
  }

  async removePost(id: string): Promise<void> {
    await this.postsRepository.deletePost(id);
    return;
  }

  async updatePostForBlog(blogId: string, postId: string, dto: CreatePostDto): Promise<void> {
    // Verify blog exists
    const blog = await this.blogsExternalQueryRepository.getByIdOrNotFoundFail(blogId);

    // Update post with blog name
    const updateData = {
      ...dto,
      blogId: blogId,
      blogName: blog.name,
    };

    await this.postsRepository.updatePost(postId, updateData);
  }

  async deletePostForBlog(blogId: string, postId: string): Promise<void> {
    // Verify blog exists
    await this.blogsExternalQueryRepository.getByIdOrNotFoundFail(blogId);

    // Delete the post
    await this.postsRepository.deletePost(postId);
  }
}
