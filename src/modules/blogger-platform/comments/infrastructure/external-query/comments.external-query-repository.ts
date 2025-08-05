import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CommentDocument, CommentModelType } from "../../domain/comment.entity";


export class CommentsExternalQueryRepository {

  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) { };

  async findCommentsByPost(postId: string, userId: string): Promise<CommentDocument> {

  }
}
