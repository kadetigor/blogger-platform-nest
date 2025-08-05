import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Comment, CommentDocument, CommentModelType } from "../../domain/comment.entity";
import { CommentLike, CommentLikeModelType } from "../../domain/comment-like.entity";

@Injectable()
export class CommentsQueryRepository{
    constructor(
        @InjectModel(Comment.name) private CommentModel: CommentModelType,
        @InjectModel(CommentLike.name) private CommentLikeModel: CommentLikeModelType,
    ) {}

    async getByIdOrNotFoundFail(id: string): Promise<CommentDocument> {
        const comment = await this.CommentModel.findOne({
          _id: id,
          deletedAt: null,
        });
    
        if (!comment) {
          throw new NotFoundException('comment not found');
        }

        return comment;
      }
}