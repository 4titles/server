import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { Poster } from './poster.entity'
import { Title } from './title.entity'

@Entity('languages')
@Index('idx_languages_code', ['code'])
@Index('idx_languages_code_name', ['code', 'name'], { unique: true })
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

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date
}
