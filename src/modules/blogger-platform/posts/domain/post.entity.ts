import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Model } from "mongoose";
import { CreatePostInputDto } from "../api/input-dto/post.input-dto";

@Schema({ timestamps: true })
export class Post {

    @Prop({ type: String, required: true })
    title: string;

    @Prop({ type: String, required: true })
    shortDescription: string;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: String, required: true })
    blogId: string;

    @Prop({ type: String, required: true })
    blogName: string;

    createdAt: Date;
    updatedAt: Date;

    @Prop({ type: Date, nullable: true })
    deletedAt: Date | null;

    static createInstance(dto: CreatePostInputDto & { blogName: string }): PostDocument {
        const post = new this();
        post.title = dto.title;
        post.shortDescription = dto.shortDescription;
        post.content = dto.content;
        post.blogId = dto.blogId;
        post.blogName = dto.blogName;

        return post as PostDocument
    }
}

export const PostSchema = SchemaFactory.createForClass(Post)

PostSchema.loadClass(Post)

export type PostDocument = HydratedDocument<Post>

export type PostModelType = Model<PostDocument> & typeof Post
