import { Injectable, NotFoundException } from "@nestjs/common";
import { Post, PostDocument, PostModelType } from "../domain/post.entity";
import { InjectModel } from "@nestjs/mongoose";
import { CreatePostDto } from "../dto/create-post.dto";
import { CreatePostInputDto } from "../api/input-dto/post.input-dto";
import { PostViewDto } from "../api/view-dto/post.view-dto";
import { Document, Types } from "mongoose";


@Injectable()
export class PostsRepository {

    constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

    async findPostById(id: string): Promise<PostDocument> {
    const post = await this.PostModel.findById(id);
    if (!post) {
      throw new NotFoundException('post not found')
    }
    return post;
  }

  async createPost(newPost: Post): Promise<PostViewDto> {
    const post = new this.PostModel(newPost);
    const savedPost = await post.save() as PostDocument;
    const result = PostViewDto.mapToView(savedPost)
    return result;
  }

  async updatePost(id: string, dto: CreatePostInputDto & { blogName?: string }): Promise<void> {
    const result = await this.PostModel.findByIdAndUpdate(
      id,
      {
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
        blogId: dto.blogId,
        blogName: dto.blogName,
      },
      { runValidators: true }
    );

    if (!result) {
      throw new NotFoundException('post not found')
    }
    return;
  }

  async deletePost(id: string): Promise<void> {
    const result = await this.PostModel.findByIdAndUpdate(
        id,
        {deletedAt: new Date()},
    )
    if (!result) {
      throw new NotFoundException('post not found')
    }

    return;
  }
}
