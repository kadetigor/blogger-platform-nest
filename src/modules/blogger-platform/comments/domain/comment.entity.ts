import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "../../posts/domain/post.entity";
import { CommentLike } from "./comment-like.entity";

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    content: string;

    @Column({ name: 'commentator_user_id' })
    commentatorUserId: string;

    @Column({ name: 'commentator_user_login' })
    commentatorUserLogin: string;

    @Column({ name: 'post_id' })
    postId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date | null;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date | null;

    @ManyToOne(() => Post)
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
    comment_likes: CommentLike[];
}

// Type exports for compatibility
export type CommentDocument = Comment;
export type CommentModelType = typeof Comment;
