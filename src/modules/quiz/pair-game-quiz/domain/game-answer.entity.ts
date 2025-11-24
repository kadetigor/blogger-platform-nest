import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AnswerStatuses } from "../dto/enums/answer-statuses.enum";
import { PairGameQuiz } from "./pair-game-quiz.entity";
import { User } from "../../../user-accounts/domain/user.entity";
import { QuizQuestion } from "../../quiz-questions/domain/quiz-question.entity";

@Entity('game_answers')
export class GameAnswer {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ name: 'game_id' })
    gameId: string

    @Column({ name: 'player_id' })
    playerId: string

    @Column({ name: 'question_id' })
    questionId: string

    @Column({ name: 'answer_number' })
    answerNumber: number

    @Column({ name: 'answer_body' })
    answerBody: string

    @Column({ type: 'enum', enum: AnswerStatuses, name: 'answer_status' })
    answerStatus: AnswerStatuses 

    @CreateDateColumn({ name: 'added_at' })
    addedAt: Date

    @ManyToOne(() => PairGameQuiz, pairGameQuiz => pairGameQuiz.gameAnswers)
    @JoinColumn({ name: 'game_id' })
    pairGameQuiz: PairGameQuiz

    @ManyToOne(() => User, user => user.gameAnswers)
    @JoinColumn({ name: 'player_id' })
    user: User

    @ManyToOne(() => QuizQuestion)
    @JoinColumn({ name: 'question_id' })
    question: QuizQuestion
}