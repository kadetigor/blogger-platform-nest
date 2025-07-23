import { PostDocument } from "../../domain/post.entity";


export class PostViewDto {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: Date;

    static mapToView(post: PostDocument): PostViewDto {
        const dto = new PostViewDto();

        dto.id = post._id.toString()
        dto.title = post.title;
        dto.shortDescription = post.shortDescription;
        dto.content = post.content;
        dto.blogId = post.blogId;
        dto.blogName = post.blogName;
        dto.createdAt = post.createdAt;

        return dto;
    }
}