import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { GameStatuses } from "../dto/enums/game-statuses.enum";
import { GameQuestion } from "./game-question.entity";
import { GameAnswer } from "./game-answer.entity";

@Entity('games')
export class PairGameQuiz {
    
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'uuid', name: 'first_player_id' })
    firstPlayerId: string

    @Column({ type: 'uuid', name: 'second_player_id', nullable: true })
    secondPlayerId: string | null

    @Column({ type: 'simple-array', nullable: true })
    questionsIds: string[] | null

    @Column({ type: 'enum', enum: GameStatuses, default: GameStatuses.PendingSecondPlayer })
    status: GameStatuses

    @Column({ type: 'timestamp', name: 'pair_created_at', nullable: true })
    pairCreatedAt: Date | null

    @Column({ type: 'timestamp', name: 'game_start_date', nullable: true })
    gameStartDate: Date | null

    @Column({ type: 'timestamp', name: 'game_finish_date', nullable: true })
    gameFinishDate: Date | null

    @Column({ type: 'int', name: 'first_player_score', default: 0 })
    firstPlayerScore: number

    @Column({ type: 'int', name: 'second_player_score', nullable: true, default: 0 })
    secondPlayerScore: number | null

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at', nullable: true})
    updatedAt: Date | null

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date | null

    @OneToMany(() => GameQuestion, gameQuestion => gameQuestion.game)
    gameQuestions: GameQuestion[]

    @OneToMany(() => GameAnswer, gameAnswer => gameAnswer.pairGameQuiz)
    gameAnswers: GameAnswer[]
}
