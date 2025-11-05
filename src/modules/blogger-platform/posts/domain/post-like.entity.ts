import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "./post.entity";

export enum LikeStatus {
    LIKE = 'Like',
    DISLIKE = 'Dislike',
    NULL = ''
}

@Entity('post_likes')
export class PostLike {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ name: 'post_id' })
    postId: string

    @Column({ name: 'user_id' })
    userId: string

    @Column({ type: "enum", enum: LikeStatus, default: '' })
    status: LikeStatus

    @Column({ name: 'added_at', type: 'timestamp' })
    addedAt: Date
    
    @Column()
    login: string
    
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date | null

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date | null

    @ManyToOne(() => Post, (post) => post.post_likes)
    @JoinColumn({ name: 'post_id' })
    post: Post
}