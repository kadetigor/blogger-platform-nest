import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PublishedStatus } from "../dto/published-status-enum";
import { GameQuestion } from "../../pair-game-quiz/domain/game-question.entity";

@Entity('quiz_question')
export class QuizQuestion {
    
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    body: string

    @Column({ name: 'correct_answers', type: 'json' })
    correctAnswers: string[]

    @Column({ name: 'published_status', type: 'enum', enum: PublishedStatus, default: PublishedStatus.NotPublished })
    publishedStatus: PublishedStatus

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true, default: null })
    updatedAt: Date | null

    // Virtual property for API
    get published(): boolean {
        return this.publishedStatus === PublishedStatus.Published;
    }

    @OneToMany(() => GameQuestion, gameQuestion => gameQuestion.question)
    gameQuestions: GameQuestion[]

}
