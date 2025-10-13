import { Injectable, NotFoundException } from "@nestjs/common";
import { Comment, CommentDocument } from "../domain/comment.entity";
import { CommentatorInfo } from "../domain/schemas/commentor-info.schema";
import { UpdateCommentDto } from "../dto/update-comment.dto";
import { DatabaseService } from "src/modules/database/database.service";

@Injectable()
export class CommentsRepository {
  constructor(private databaseService: DatabaseService) {}

  private mapToComment(row: any): Comment | null {
    if (!row) return null;

    return new Comment(
      row.id,
      row.content,
      new CommentatorInfo(
        row.commentator_user_id,
        row.commentator_user_login
      ),
      row.post_id,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }

  async findByIdOrFail(id: string): Promise<CommentDocument> {
    const result = await this.databaseService.sql`
      SELECT * FROM comments
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!result[0]) {
      throw new NotFoundException('Comment does not exist');
    }

    const comment = this.mapToComment(result[0]);
    if (!comment) {
      throw new NotFoundException('Comment does not exist');
    }

    return comment;
  }

  async updateComment(id: string, dto: UpdateCommentDto): Promise<void> {
    const result = await this.databaseService.sql`
      UPDATE comments
      SET
        content = ${dto.content},
        updated_at = ${new Date()}
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      RETURNING *
    `;

    if (!result[0]) {
      throw new NotFoundException('Comment does not exist');
    }
  }

  async removeComment(id: string): Promise<void> {
    const result = await this.databaseService.sql`
      UPDATE comments
      SET deleted_at = ${new Date()}
      WHERE id = ${id}::uuid
      AND deleted_at IS NULL
      RETURNING *
    `;

    if (!result[0]) {
      throw new NotFoundException('Comment does not exist');
    }
  }

  async createComment(newComment: Comment): Promise<CommentDocument> {
    // Validate required fields
    if (!newComment.commentatorInfo?.userId) {
      throw new Error(`commentatorInfo.userId is required but got: ${newComment.commentatorInfo?.userId}`);
    }
    if (!newComment.postId) {
      throw new Error(`postId is required but got: ${newComment.postId}`);
    }

    const result = await this.databaseService.sql`
      INSERT INTO comments (content, commentator_user_id, commentator_user_login, post_id, created_at, updated_at)
      VALUES (
        ${newComment.content},
        ${newComment.commentatorInfo.userId}::uuid,
        ${newComment.commentatorInfo.userLogin},
        ${newComment.postId}::uuid,
        ${newComment.createdAt},
        ${newComment.updatedAt}
      )
      RETURNING *
    `;

    const savedComment = this.mapToComment(result[0]);
    if (!savedComment) {
      throw new Error('Failed to create comment');
    }
    return savedComment;
  }
}
