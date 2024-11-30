import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm'
import { TitleType } from './title.entity'
import { ITitle } from '../modules/imdb/interfaces/imdb-top100.interface'

@Entity('raw_titles')
@Index('idx_raw_titles_imdb_id', ['imdbId'], { unique: true })
export class RawTitle {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({
        name: 'imdb_id',
        type: 'varchar',
        length: 20,
    })
    imdbId: string

    @Column({
        type: 'enum',
        enum: TitleType,
    })
    type: TitleType

    @Column({
        type: 'jsonb',
        comment: 'Raw JSON data from IMDB Top100 API',
    })
    data: ITitle
}
