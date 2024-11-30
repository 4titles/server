import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Title } from './title.entity'
import { Name } from './name.entity'

export enum CreditCategory {
    ACTOR = 'actor',
    ACTRESS = 'actress',
    DIRECTOR = 'director',
    WRITER = 'writer',
}

@Entity('credits')
@Index('idx_credits_category', ['category'])
@Index('idx_credits_title_name', ['title', 'name'], { unique: true })
export class Credit {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({ type: 'enum', enum: CreditCategory })
    category: string

    @Column({ type: 'jsonb', nullable: true })
    characters: string[]

    @Column({ name: 'episodes_count', type: 'integer', nullable: true })
    episodesCount: number

    @ManyToOne(() => Title, (title) => title.credits)
    @JoinColumn({ name: 'title_id' })
    title: Title

    @ManyToOne(() => Name, (name) => name.id)
    @JoinColumn({ name: 'name_id' })
    name: Name

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
