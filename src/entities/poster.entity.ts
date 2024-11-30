import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Title } from './title.entity'
import { Language } from './language.entity'

@Entity('posters')
@Index('idx_posters_title_language', ['title', 'language'])
@Index('idx_posters_url', ['title', 'url'], { unique: true })
export class Poster {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({
        type: 'varchar',
        length: 255,
        comment: 'The direct address of poster.',
    })
    url: string

    @Column({
        type: 'integer',
        nullable: true,
        comment: "The poster's width in pixels",
    })
    width: number

    @Column({
        type: 'integer',
        nullable: true,
        comment: "The poster's height in pixels",
    })
    height: number

    @ManyToOne(() => Language, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'language_id' })
    language: Language | null

    @ManyToOne(() => Title, (title) => title.posters, {
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
