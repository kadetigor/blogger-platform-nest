import { Injectable, Post } from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostModelType } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { PostViewDto } from '../api/view-dto/post.view-dto';

@Injectable()
export class PostsService {

  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private postsRepository: PostsRepository,
  ) {}

  async createPost(dto: CreatePostDto): Promise<string> {

    const post = this.PostModel.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId
    })

    return this.postsRepository.createPost(post);
  }


  async updatePost(id: string, dto: CreatePostDto): Promise<void> {

    const result = await this.postsRepository.updatePost(id, dto);
    return result;
  }

  async removePost(id: string): Promise<void> {
    await this.postsRepository.deletePost(id);
    return;
  }
}
