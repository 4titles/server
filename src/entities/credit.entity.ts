import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
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
@Index('idx_credits_title_name', ['title', 'name'])
export class Credit {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({ type: 'enum', enum: CreditCategory })
    category: string

    @Column({ type: 'jsonb', nullable: true })
    characters: string[]

    @Column({ name: 'episodes_count', type: 'integer', nullable: true })
    episodesCount: number

    @ManyToOne(() => Title, (title) => title.credits, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'title_id' })
    title: Title

    @ManyToOne(() => Name, (name) => name.credits, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'name_id' })
    name: Name

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date
}
