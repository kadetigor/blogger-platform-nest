import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PublishedStatus } from "../dto/published-status-enum";

@Entity()
export class QuizQuestion {
    
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    body: string

    @Column({ name: 'correct_answers', type: 'simple-array' })
    correctAnswers: string[]

    @Column({default: false})
    published: boolean

    @Column({ name: 'published_status', type: 'enum', enum: PublishedStatus, default: PublishedStatus.NotPublished })
    publishedStatus: PublishedStatus

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at', nullable: true})
    updatedAt: Date | null

}
