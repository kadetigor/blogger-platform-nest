import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Comment, CommentDocument } from "../domain/comment.entity";
import { UpdateCommentDto } from "../dto/update-comment.dto";

@Injectable()
export class CommentsRepository {
  constructor(@InjectRepository(Comment) private repository: Repository<Comment>) {}

  async findByIdOrFail(id: string): Promise<CommentDocument> {
    const comment = await this.repository.findOne({
      where: {
        id,
        deletedAt: IsNull()
      }
    });

    if (!comment) {
      throw new NotFoundException('Comment does not exist');
    }

    return comment;
  }

  async updateComment(id: string, dto: UpdateCommentDto): Promise<void> {
    const result = await this.repository.update(
      { id, deletedAt: IsNull() },
      { content: dto.content }
    );

    if (result.affected === 0) {
      throw new NotFoundException('Comment does not exist');
    }
  }

  async removeComment(id: string): Promise<void> {
    const result = await this.repository.softDelete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Comment does not exist');
    }
  }

  async createComment(commentData: {
    content: string;
    commentatorUserId: string;
    commentatorUserLogin: string;
    postId: string;
  }): Promise<CommentDocument> {
    // Validate required fields
    if (!commentData.commentatorUserId) {
      throw new Error(`commentatorUserId is required but got: ${commentData.commentatorUserId}`);
    }
    if (!commentData.postId) {
      throw new Error(`postId is required but got: ${commentData.postId}`);
    }

    const newComment = this.repository.create({
      content: commentData.content,
      commentatorUserId: commentData.commentatorUserId,
      commentatorUserLogin: commentData.commentatorUserLogin,
      postId: commentData.postId
    });

    return await this.repository.save(newComment);
  }
}
