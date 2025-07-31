import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import { BlogViewDto } from '../api/view-dto/blogs.view-dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  async createBlog(dto: CreateBlogDto): Promise<string> {
    const blog = this.BlogModel.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });
    return this.blogsRepository.create(blog);
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<BlogDocument> {
    const result = await this.blogsRepository.update(id, dto);
    return result;
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.delete(id);
    return;
  }
}
