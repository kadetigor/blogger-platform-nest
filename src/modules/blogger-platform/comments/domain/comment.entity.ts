import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CommentatorInfo, CommentatorInfoSchema } from "./schemas/commentor-info.schema";
import { HydratedDocument, HydrateOptions, Model } from "mongoose";
import { CreateCommentDto } from "../dto/create-comment.dto";


@Schema({ timestamps: true })
export class Comment {
    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: CommentatorInfoSchema })
    commentatorInfo: CommentatorInfo

    @Prop ({ type: String, required: true })
    postId: string;

    createdAt: Date;

    @Prop ({ type: Date, nullable: true })
    deletedAt: Date | null;

    static createInstance(dto: CreateCommentDto): CommentDocument {
        const comment = new this();
        comment.content = dto.content;
        comment.commentatorInfo = {  // Fixed: Initialize the object
            userId: dto.commentatorInfo.userId,
            userLogin: dto.commentatorInfo.userLogin
        };
        comment.postId = dto.postId;
        comment.deletedAt = null;

        return comment as CommentDocument
    }

}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment)

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;