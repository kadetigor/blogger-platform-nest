import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Comment, CommentDocument, CommentModelType } from "../domain/comment.entity";
import { CreateCommentInputDto } from "../api/input-dto.ts/create-comment.input-dto";
import { UpdateCommentDto } from "../dto/update-comment.dto";


@Injectable()
export class CommentsRepository {
  constructor(@InjectModel(Comment.name) private CommentModel: CommentModelType) { }
  async findByIdOrFail(id: string): Promise<CommentDocument> {
    const result = await this.CommentModel.findById(id)

    if (!result) {
      throw new NotFoundException('Comment does not exist')
    }

    return result
  }

  async updateComment(id: string, dto: UpdateCommentDto): Promise<void> {
    const result = await this.CommentModel.findByIdAndUpdate(id, {
      content: dto.content
    });

    if (!result) {
      throw new NotFoundException('Comment does not exist');
    }
  }

  async removeComment(id: string): Promise<void> {
    const result = await this.CommentModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
    });

    if (!result) {
      throw new NotFoundException('Comment does not exist');
    }
  }

  async createComment(newComment: Comment): Promise<CommentDocument> {
    const comment = new this.CommentModel(newComment);
    const savedComment = await comment.save()
    return savedComment
  }

}
