import { ObjectType } from '@nestjs/graphql'
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm'

export enum TitleType {
    MOVIE = 'movie',
    TV_SERIES = 'tvSeries',
}

@ObjectType()
@Entity('titles')
@Index('IDX_titles_imdbid', ['imdbid'], { unique: true })
export class Title {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ name: 'title_name', type: 'varchar', length: 255 })
    titleName: string

    @Column({ name: 'imdbid', type: 'varchar', length: 255 })
    imdbid: string

    @Column({ type: 'integer', nullable: true, unsigned: true, unique: true })
    rank: number | null

    @Column({ type: 'varchar', nullable: true, unique: true })
    image: string | null

    @Column({ type: 'text', nullable: true })
    description: string | null

    @Column({ type: 'json', default: '[]' })
    genre: string[]

    @Column({ type: 'numeric', nullable: true })
    rating: number | null

    @Column({ name: 'imdb_link', type: 'varchar', nullable: true })
    imdbLink: string | null

    @Column({ type: 'integer', nullable: true, unsigned: true })
    year: number | null

    @Column({
        type: 'timestamp',
        name: 'created_at',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date

    @Column({
        type: 'timestamp',
        name: 'updated_at',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date
}
