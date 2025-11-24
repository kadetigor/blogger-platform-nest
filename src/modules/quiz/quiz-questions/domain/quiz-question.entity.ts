import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PublishedStatus } from "../dto/published-status-enum";
import { PairGameQuiz } from "../../pair-game-quiz/domain/pair-game-quiz.entity";
import { GameQuestion } from "../../pair-game-quiz/domain/game-question.entity";

@Entity('quiz_question')
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

    @OneToMany(() => GameQuestion, gameQuestion => gameQuestion.question)
    gameQuestions: GameQuestion[]

}
