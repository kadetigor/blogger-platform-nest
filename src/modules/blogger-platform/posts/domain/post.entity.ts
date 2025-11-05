import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CreatePostInputDto } from "../api/input-dto/post.input-dto";
import { Blog } from "../../blogs/domain/blog.entity";
import { User } from "src/modules/user-accounts/domain/user.entity";
import { PostLike } from "./post-like.entity";


@Entity('posts')
export class Post {
  
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ name: 'short_description' })
  shortDescription: string

  @Column()
  content: string

  @Column({ name: 'blog_id' })
  blogId: string

  @Column({ name: 'blog_name', nullable: true })
  blogName: string
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | null

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null


  @ManyToOne(() => Blog, (blog) => blog.posts)
  @JoinColumn({ name: 'blog_id' })
  blog: Blog

  @OneToMany(() => PostLike, (post_likes) => post_likes.post)
  post_likes: PostLike[]
}


// export class Post {
//   constructor(
//     public id: string,
//     public title: string,
//     public shortDescription: string,
//     public content: string,
//     public blogId?: string,
//     public blogName?: string,
//     public createdAt: Date = new Date(),
//     public updatedAt: Date = new Date(),
//     public deletedAt: Date | null = null
//   ) {}

//   makeDeleted(): void {
//     this.deletedAt = new Date();
//   }

//   update(updates: Partial<Post>): void {
//     if (updates.title) this.title = updates.title;
//     if (updates.shortDescription) this.shortDescription = updates.shortDescription;
//     if (updates.content) this.content = updates.content;
//     this.updatedAt = new Date();
//   }

//   static createInstance(dto: CreatePostInputDto, blogId: string, blogName: string): Post {
//     return new Post(
//       '',
//       dto.title,
//       dto.shortDescription,
//       dto.content,
//       blogId,
//       blogName
//     );
//   }
// }

// // Type exports for compatibility
// export type PostDocument = Post;
// export type PostModelType = typeof Post;