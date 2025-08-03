import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CommentModelType } from "../domain/comment.entity";


@Injectable()
export class CommentsRepository{
    constructor(@InjectModel(Comment.name) private CommentModel: CommentModelType){}


}