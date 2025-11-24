import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { PairGameQuiz } from "./pair-game-quiz.entity"
import { QuizQuestion } from "../../quiz-questions/domain/quiz-question.entity"

@Entity('game_questions')
export class GameQuestion {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    order: number // Порядок вопроса в игре (1, 2, 3...)

    @ManyToOne(() => PairGameQuiz, game => game.gameQuestions)
    @JoinColumn({ name: 'game_id' })
    game: PairGameQuiz

    @ManyToOne(() => QuizQuestion, question => question.gameQuestions)
    @JoinColumn({ name: 'question_id' })
    question: QuizQuestion
}