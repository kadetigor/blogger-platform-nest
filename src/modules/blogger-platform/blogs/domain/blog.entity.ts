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
