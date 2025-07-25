import { PostDocument } from "../../domain/post.entity";

// src/modules/blogger-platform/posts/api/view-dto/post.view-dto.ts
export class PostViewDto {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: Date;
    extendedLikesInfo: {
        dislikesCount: number;
        likesCount: number;
        myStatus: string;
        newestLikes: any[];
    };

    static mapToView(post: PostDocument): PostViewDto {
        const dto = new PostViewDto();

        dto.id = post._id.toString()
        dto.title = post.title;
        dto.shortDescription = post.shortDescription;
        dto.content = post.content;
        dto.blogId = post.blogId;
        dto.blogName = post.blogName;
        dto.createdAt = post.createdAt;
        dto.extendedLikesInfo = {
            dislikesCount: 0,
            likesCount: 0,
            myStatus: "None",
            newestLikes: []
        };

        return dto;
    }
}