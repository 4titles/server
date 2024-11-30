import {
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm'
import { Title } from './title.entity'

@Entity('ratings')
@Index('idx_ratings_aggregate_rating', ['aggregateRating'])
@Index('idx_ratings_title_id', ['titleId'], { unique: true })
export class Rating {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({
        name: 'aggregate_rating',
        type: 'decimal',
        precision: 3,
        scale: 1,
        nullable: true,
    })
    aggregateRating: number

    @Column({ name: 'votes_count', type: 'integer', nullable: true })
    votesCount: number

    @Column({ name: 'title_id' })
    titleId: number

    @OneToOne(() => Title, (title) => title.rating, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'title_id' })
    title: Title

    @Column({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date
}
