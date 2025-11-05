import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Blog } from '../domain/blog.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBlogInputDto } from '../api/input-dto/blogs.input-dto';

@Injectable()
export class BlogsRepository {
  constructor(@InjectRepository(Blog) private repository: Repository<Blog>) {}

  async save(blog: Blog): Promise<Blog> {
    try {
      return this.repository.save(blog);
    } catch (error) {
      throw new ServiceUnavailableException('unable to save to Database')
    } 
  }

  async findBlogById(id: string): Promise<Blog | null> {
    try {
      const result = await this.repository.findOneBy({id})
      return result
    } catch(error) {
      throw new NotFoundException('blog was not found')
      return null
    }
  }

  async createBlog(dto: CreateBlogInputDto): Promise<Blog> {
    const blog = this.repository.create({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl
    })

    return this.repository.save(blog);
  }

  async updateBlog(id: string, dto: CreateBlogInputDto): Promise<Blog> {
    await this.repository.update({id}, dto)

    const updatedBlog = await this.findBlogById(id);

    if (!updatedBlog) {
      throw new NotFoundException
    } else {
      return updatedBlog
    }
  }

  async deleteBlog(id: string): Promise<void> {
    const result = await this.repository.softDelete({id})

    if (result.affected === 0) {
      throw new NotFoundException
    } else {
      return
    }
  }
}
