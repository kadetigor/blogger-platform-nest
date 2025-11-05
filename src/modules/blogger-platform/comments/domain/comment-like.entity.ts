import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Comment } from "./comment.entity";

export enum CommentLikeStatus {
    LIKE = 'Like',
    DISLIKE = 'Dislike'
}

@Entity('comment_likes')
export class CommentLike {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'comment_id' })
    commentId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ type: "enum", enum: CommentLikeStatus })
    status: CommentLikeStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date | null;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date | null;

    @ManyToOne(() => Comment, (comment) => comment.comment_likes)
    @JoinColumn({ name: 'comment_id' })
    comment: Comment;
}

// Type exports for compatibility
export type CommentLikeDocument = CommentLike;
export type CommentLikeModelType = typeof CommentLike;
