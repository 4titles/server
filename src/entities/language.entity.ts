import {
    Column,
    Entity,
    Index,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Poster } from './poster.entity'
import { Title } from './title.entity'

@Entity('languages')
@Index('idx_languages_code', ['code'], { unique: true })
@Index('idx_languages_name', ['name'])
export class Language {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({
        type: 'varchar',
        length: 3,
        comment: 'ISO 639-3 language codes (three-letter).',
    })
    code: string

    @Column({
        type: 'varchar',
        length: 100,
        comment: 'English name of Language.',
    })
    name: string

    @OneToMany(() => Poster, (poster) => poster.language)
    posters: Poster[]

    @ManyToMany(() => Title, (title) => title.spokenLanguages)
    titles: Title[]

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
