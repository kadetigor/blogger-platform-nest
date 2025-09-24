import { Injectable, NotFoundException } from '@nestjs/common';
import { Post, PostDocument } from '../domain/post.entity';
import { CreatePostInputDto } from '../api/input-dto/post.input-dto';
import { PostViewDto } from '../api/view-dto/post.view-dto';
import { DatabaseService } from 'src/modules/database/database.service';

@Injectable()
export class PostsRepository {
  constructor(private databaseService: DatabaseService) {}

  private mapToPost(row: any): Post | null {
      if (!row) return null;

      return new Post(
        row.id,
        row.title,
        row.short_description,
        row.content,
        row.blog_id,
        row.blog_name,
        row.created_at,
        row.updated_at,
        row.deleted_at
      );
    }

  async findPostById(id: string): Promise<PostDocument> {
    const result = await this.databaseService.sql`
      SELECT * FROM posts
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!result[0]) {
      throw new NotFoundException('post not found');
    }

    const post = this.mapToPost(result[0]);
    if (!post) {
      throw new NotFoundException('post not found');
    }

    return post;
  }

  async createPost(newPost: Post): Promise<PostViewDto> {
    const result = await this.databaseService.sql`
      INSERT INTO posts (title, short_description, content, blog_id, blog_name, created_at, updated_at)
      VALUES (
        ${newPost.title},
        ${newPost.shortDescription},
        ${newPost.content},
        ${newPost.blogId}::uuid,
        ${newPost.blogName},
        ${newPost.createdAt},
        ${newPost.updatedAt}
      )
      RETURNING *
    `;

    const savedPost = this.mapToPost(result[0]);
    if (!savedPost) {
      throw new Error('Failed to create post');
    }
    return PostViewDto.mapToView(savedPost);
  }

  async updatePost(
    id: string,
    dto: CreatePostInputDto & { blogName?: string },
  ): Promise<void> {
    const result = await this.databaseService.sql`
      UPDATE posts
      SET
        title = ${dto.title},
        short_description = ${dto.shortDescription},
        content = ${dto.content},
        blog_id = ${dto.blogId}::uuid,
        blog_name = ${dto.blogName},
        updated_at = ${new Date()}
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      RETURNING *
    `;

    if (!result[0]) {
      throw new NotFoundException('post not found');
    }
    return;
  }

  async deletePost(id: string): Promise<void> {
    const result = await this.databaseService.sql`
      UPDATE posts
      SET deleted_at = ${new Date()}
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      RETURNING *
    `;

    if (!result[0]) {
      throw new NotFoundException('post not found');
    }

    return;
  }
}
