import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CommentatorInfoSchema } from "./schemas/commentor-info.schema";
import { HydratedDocument, Model } from "mongoose";
import { CreateCommentLikeDto } from "../dto/create-comment-like.dto";

@Schema({ timestamps: true })
export class CommentLike {
    @Prop({ type: String, required: true })
    commentId: string;

    @Prop({ type: String, required: true })
    userId: string;

    @Prop ({ type: String, enum: ["Like", "Dislike"], required: true })
    status: string;

    createdAt: Date;

    @Prop ({ type: Date, nullable: true })
    deletedAt: Date | null;

    static createInstance(dto: CreateCommentLikeDto): CommentLikeDocument {
        const commentLike = new this();
        commentLike.commentId = dto.commentId;
        commentLike.userId = dto.userId;
        commentLike.status = dto.status;
        commentLike.deletedAt = null;

        return commentLike as CommentLikeDocument
    }

    makeDeleted() {
        if (this.deletedAt !== null) {
        throw new Error('Entity already deleted');
        }
        this.deletedAt = new Date();
    }
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

CommentLikeSchema.loadClass(CommentLike)

export type CommentLikeDocument = HydratedDocument<CommentLike>;

export type CommentLikeModelType = Model<CommentLikeDocument> & typeof CommentLike;