import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Model } from "mongoose";

@Schema()
export class PostLike {
    
    @Prop({ type: String, required: true })
    postId: string;

    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ type: String, enum: ["Like", "Dislike"], required: true })
    status: string;

    createdAt: Date;

    @Prop ({ type: Date, nullable: true })
    deletedAt: Date | null;
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

PostLikeSchema.loadClass(PostLike)

export type PostLikeDocument = HydratedDocument<PostLike>;

export type PostLikeModelType = Model<PostLikeDocument> & typeof PostLike;