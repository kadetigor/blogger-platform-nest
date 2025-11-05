import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "../../posts/domain/post.entity";


@Entity('blogs')
export class Blog {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  description: string

  @Column({ name: 'website_url' })
  websiteUrl: string

  @Column({ name: 'is_membership', default: false })
  isMembership: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | null

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null

  @OneToMany(() => Post, (posts) => posts.blog)
  posts: Post[]
}

// export class Blog {

//   constructor(
//     public id: string,
//     public name: string,
//     public description: string,
//     public websiteUrl: string,
//     public isMembership: boolean = false,
//     public createdAt: Date = new Date(),
//     public updatedAt: Date = new Date(),
//     public deletedAt: Date | null = null
//   ) {}

//   makeDeleted(): void {
//     this.deletedAt = new Date();
//   }

//   update(updates: Partial<Blog>): void {
//     if (updates.name) this.name = updates.name;
//     if (updates.description) this.description = updates.description;
//     if (updates.websiteUrl) this.websiteUrl = updates.websiteUrl;
//     this.updatedAt = new Date();
//   }

//   // Factory method to replace Mongoose's createInstance
//   static createInstance(dto: {
//     name: string;
//     description: string;
//     websiteUrl: string;
//   }): Blog {
//     return new Blog(
//       '', // Will be set by database with gen_random_uuid()
//       dto.name,
//       dto.description,
//       dto.websiteUrl
//     );
//   }
// }

// // Type exports for compatibility
// export type BlogDocument = Blog;
// export type BlogModelType = typeof Blog;






// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { HydratedDocument, Model } from 'mongoose';
// import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';

// @Schema({ timestamps: true })
// export class Blog {
//   @Prop({ type: String, required: true })
//   name: string;

//   @Prop({ type: String, required: true })
//   description: string;

//   @Prop({ type: String, required: true })
//   websiteUrl: string;

//   @Prop({ type: Boolean, required: true, default: false })
//   isMembership: boolean;

//   createdAt: Date;
//   updatedAt: Date;

//   @Prop({ type: Date, nullable: true })
//   deletedAt: Date | null;

//   static createInstance(dto: CreateBlogDto): BlogDocument {
//     const blog = new this();
//     blog.name = dto.name;
//     blog.description = dto.description;
//     blog.websiteUrl = dto.websiteUrl;
//     blog.createdAt = new Date();
//     blog.updatedAt = new Date();

//     return blog as BlogDocument;
//   }

//   makeDeleted() {
//     if (this.deletedAt !== null) {
//       throw new Error('Entity already deleted');
//     }
//     this.deletedAt = new Date();
//   }

//   update(dto: UpdateBlogDto) {
//     this.name = dto.name;
//     this.description = dto.description;
//     this.websiteUrl = dto.websiteUrl;
//   }
// }

// export const BlogSchema = SchemaFactory.createForClass(Blog);

// BlogSchema.loadClass(Blog);

// export type BlogDocument = HydratedDocument<Blog>;

// export type BlogModelType = Model<BlogDocument> & typeof Blog;
