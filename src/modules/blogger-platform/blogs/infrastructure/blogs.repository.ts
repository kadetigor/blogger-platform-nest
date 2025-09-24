import { Injectable, NotFoundException } from '@nestjs/common';
import { Blog, BlogDocument } from '../domain/blog.entity';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';
import { DatabaseService } from 'src/modules/database/database.service';

@Injectable()
export class BlogsRepository {
  constructor(private databaseService: DatabaseService) {}

  private mapToBlog(row: any): Blog | null {
    if (!row) return null;

    return new Blog(
      row.id,
      row.name,
      row.description,
      row.website_url,
      row.is_membership || false,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }

  async save(blog: BlogDocument): Promise<BlogDocument> {
    const id = blog.id;

    if (id && id !== '') {
      const result = await this.databaseService.sql`
        UPDATE blogs
        SET
          name = ${blog.name},
          description = ${blog.description},
          website_url = ${blog.websiteUrl},
          is_membership = ${blog.isMembership},
          deleted_at = ${blog.deletedAt},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `;

      if (result.length === 0) {
        throw new NotFoundException('Blog not found');
      }

      const updatedBlog = this.mapToBlog(result[0]);
      if (!updatedBlog) {
        throw new Error('Faild to map blog from database');
      }

      return updatedBlog;
    } else {
      const result = await this.databaseService.sql`
        INSERT INTO blogs (
          name,
          description,
          website_url,
          is_membership
        ) VALUES (
          ${blog.name},
          ${blog.description},
          ${blog.websiteUrl},
          ${blog.isMembership}
        )
        RETURNING *
      `;

      const newBlog = this.mapToBlog(result[0]);
      if (!newBlog) {
        throw new Error('Faild to create blog');
      }

      return newBlog;
    }
  }

  async findById(id: string): Promise< BlogDocument | null > {
    try {
      const result = await this.databaseService.sql`
        SELECT * FROM blogs
        WHERE id = ${id}::uuid
        AND deleted_at IS NULL
        LIMIT 1
      `;

      return this.mapToBlog(result[0]);
    } catch (error) {
      // Invalid uuid format
      return null
    }
  }

  async create(dto: CreateBlogDto): Promise<BlogDocument> {
    const blog = Blog.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl
    });

    return this.save(blog);
  }

  async update(id: string, dto: UpdateBlogDto): Promise< BlogDocument | null > {
    const result = await this.databaseService.sql`
      UPDATE blogs
      SET
        name = ${dto.name},
        description = ${dto.description},
        website_url = ${dto.websiteUrl},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      RETURNING *
    `;

    if (!result[0]) {
      throw new NotFoundException('Blog does not exist');
    }

    return this.mapToBlog(result[0]);
  }

  async delete(id: string): Promise<void> {
    const result = await this.databaseService.sql`
      UPDATE blogs
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      RETURNING *
    `;

    if (!result[0]) {
      throw new NotFoundException('Blog does not exist');
    }
  }
}
