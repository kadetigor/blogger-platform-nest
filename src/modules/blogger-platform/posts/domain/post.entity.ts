import { CreatePostInputDto } from "../api/input-dto/post.input-dto";


export class Post {
  constructor(
    public id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId?: string,
    public blogName?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  makeDeleted(): void {
    this.deletedAt = new Date();
  }

  update(updates: Partial<Post>): void {
    if (updates.title) this.title = updates.title;
    if (updates.shortDescription) this.shortDescription = updates.shortDescription;
    if (updates.content) this.content = updates.content;
    this.updatedAt = new Date();
  }

  static createInstance(dto: CreatePostInputDto, blogId: string, blogName: string): Post {
    return new Post(
      '',
      dto.title,
      dto.shortDescription,
      dto.content,
      blogId,
      blogName
    );
  }
}

// Type exports for compatibility
export type PostDocument = Post;
export type PostModelType = typeof Post;