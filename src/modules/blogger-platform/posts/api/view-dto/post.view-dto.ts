import { Post } from '../../domain/post.entity';

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
    myStatus: "Like" | "Dislike" | "None";
    newestLikes: Array<{ addedAt: Date; userId: string; login: string; }>
  };

  static mapToView(
    post: Post,
    likesInfo?: {
      likesCount: number;
      dislikesCount: number;
      myStatus: "Like" | "Dislike" | "None";
      newestLikes: Array<{ addedAt: Date; userId: string; login: string; }>
    }
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post.id;
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId || '';
    dto.blogName = post.blogName || '';
    dto.createdAt = post.createdAt;
    dto.extendedLikesInfo = likesInfo || {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: 'None',
      newestLikes: [],
    };

    return dto;
  }
}
