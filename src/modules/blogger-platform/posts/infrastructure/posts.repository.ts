import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Post } from '../domain/post.entity';
import { CreatePostInputDto } from '../api/input-dto/post.input-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class PostsRepository {
  constructor(@InjectRepository(Post) private repository: Repository<Post>) {}

  async save(post: Post): Promise<Post> {
    try {
      return this.repository.save(post);
    } catch (error) {
      throw new ServiceUnavailableException('unable to save to Database')
    } 
  }

  async createPost(dto: CreatePostInputDto): Promise<Post> {
    const post = this.repository.create({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId
    })
  
    return this.repository.save(post)
  }

  async updatePost(id: string, dto: CreatePostInputDto & { blogName?: string }): Promise<void> {
    await this.repository.update({id}, dto)

    const updatedPost = await this.findPostById(id);

    if (!updatedPost) {
      throw new NotFoundException
    } else {
      return
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      await this.repository.softDelete({id})
    } catch (error) {
      throw new NotFoundException
    }
  }

  async findPostById(id: string): Promise<Post | null> {
    try {
      const result = await this.repository.findOneBy({
        id: id,
        deletedAt: IsNull()
      });
      
      return result;
    } catch (error) {
      // Invalid UUID format
      return null;
    }
  }
}
