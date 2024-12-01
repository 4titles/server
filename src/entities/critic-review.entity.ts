import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { Title } from './title.entity'

@Entity('critic_reviews')
@Index('idx_critic_reviews_score', ['score'])
@Index('idx_critic_reviews_title_id', ['title'], { unique: true })
export class CriticReview {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({ type: 'integer', nullable: true })
    score: number

    @OneToOne(() => Title, (title) => title.criticReview)
    @JoinColumn({ name: 'title_id' })
    title: Title

    @Column({
        name: 'review_count',
        type: 'integer',
        nullable: true,
        comment: 'The number of reviews',
    })
    reviewCount: number

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date
}
