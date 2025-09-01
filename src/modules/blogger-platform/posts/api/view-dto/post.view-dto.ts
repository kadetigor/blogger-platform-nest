import { PostDocument } from '../../domain/post.entity';

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

  static mapToView(
    post: PostDocument, 
    likesInfo?: {
      likesCount: number;
      dislikesCount: number;
      myStatus: "Like" | "Dislike" | "None";
      newestLikes: Array<{ addedAt: Date; userId: string; login: string; }>
    }
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = post.createdAt;
    dto.extendedLikesInfo = {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: 'None',
      newestLikes: [],
    };

    dto.extendedLikesInfo = likesInfo || {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: 'None',
      newestLikes: [],
    };

    return dto;
  }
}
