import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import { Blog } from '../domain/blog.entity';

@Injectable()
export class BlogsService {
  constructor(
    private blogsRepository: BlogsRepository,
  ) {}

  async createBlog(dto: CreateBlogDto): Promise<string> {
    const savedBlog = await this.blogsRepository.createBlog(dto)
    return savedBlog.id;
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<Blog> {
    const result = await this.blogsRepository.updateBlog(id, dto);
    return result;
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.deleteBlog(id);
    return;
  }
}
