import { ObjectType } from '@nestjs/graphql'
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    Index,
    OneToMany,
    ManyToMany,
    JoinColumn,
    OneToOne,
    JoinTable,
} from 'typeorm'
import { Rating } from './rating.entity'
import { Certificate } from './certificate.entity'
import { Country } from './country.entity'
import { Language } from './language.entity'
import { Poster } from './poster.entity'
import { Credit } from './credit.entity'
import { CriticReview } from './critic-review.entity'
import { Name } from './name.entity'

export enum TitleType {
    MOVIE = 'movie',
    TV_SERIES = 'tvSeries',
}

@ObjectType()
@Entity('titles')
@Index('idx_titles_imdbid', ['imdbId'], { unique: true })
@Index('idx_titles_type', ['type'])
@Index('idx_titles_primary_title', ['primaryTitle'])
@Index('idx_titles_start_year', ['startYear'])
@Index('idx_titles_end_year', ['endYear'])
@Index('idx_titles_runtime_minutes', ['runtimeMinutes'])
@Index('idx_titles_created_at', ['createdAt'])
@Index('idx_titles_rating_id', ['rating'])
export class Title {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({
        name: 'imdb_id',
        type: 'varchar',
        length: 20,
        comment:
            'The unique IMDb ID for the title. Each IMDb ID appears exactly once.',
    })
    imdbId: string

    @Column({
        type: 'enum',
        enum: TitleType,
        comment: "The type of this title, e.g. 'movie' or 'tvSeries'.",
    })
    type: TitleType

    @Column({
        name: 'is_adult',
        type: 'boolean',
        default: false,
        comment: 'Whether or not this title contains adult content.',
    })
    isAdult: boolean

    @Column({
        name: 'primary_title',
        type: 'varchar',
        length: 255,
        comment: 'The primary title text of the title.',
    })
    primaryTitle: string

    @Column({
        name: 'original_title',
        type: 'varchar',
        length: 255,
        comment:
            'The original title text of the title, normally what the title is known as in its original country of release.',
        nullable: true,
    })
    originalTitle: string

    @Column({
        name: 'start_year',
        type: 'integer',
        nullable: true,
        comment: 'The year of the earliest release of this title globally.',
    })
    startYear: number

    @Column({
        name: 'end_year',
        type: 'integer',
        nullable: true,
        comment:
            'The year when the last episode/series finale of the show has aired. When a show is still running the end year will be omitted.',
    })
    endYear: number

    @Column({
        name: 'runtime_minutes',
        type: 'integer',
        nullable: true,
        comment: 'The running time of this title in minutes.',
    })
    runtimeMinutes: number

    @Column({ type: 'text', nullable: true, comment: 'A plot description.' })
    plot: string

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

    /** Relationships */

    @OneToOne(() => Rating, (rating) => rating.title, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'rating_id' })
    rating: Rating | null

    @OneToMany(() => Certificate, (certificate) => certificate.title, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    certificates: Certificate[]

    @ManyToMany(() => Language, (language) => language.titles, {
        onDelete: 'CASCADE',
    })
    @JoinTable({
        name: 'titles_languages',
        joinColumn: {
            name: 'title_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'language_id',
            referencedColumnName: 'id',
        },
    })
    spokenLanguages: Language[]

    @ManyToMany(() => Country, (country) => country.titles, {
        onDelete: 'CASCADE',
    })
    @JoinTable({
        name: 'titles_origin_countries',
        joinColumn: {
            name: 'title_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'country_id',
            referencedColumnName: 'id',
        },
    })
    originCountries: Country[]

    @OneToMany(() => Poster, (poster) => poster.title, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    posters: Poster[]

    @OneToMany(() => Credit, (credit) => credit.title, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    credits: Credit[]

    @ManyToMany(() => Name)
    @JoinTable({
        name: 'names_known_for_titles',
        joinColumn: {
            name: 'title_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'name_id',
            referencedColumnName: 'id',
        },
    })
    knownForNames: Name[]

    @OneToOne(() => CriticReview, (criticReview) => criticReview.title, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    criticReview: CriticReview
}
