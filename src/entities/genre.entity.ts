import {
    Column,
    Entity,
    Index,
    ManyToMany,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Title } from './title.entity'

@Entity('genres')
@Index('idx_genres_name', ['name'], { unique: true })
export class Genre {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({ type: 'varchar', length: 50 })
    name: string

    @ManyToMany(() => Title, (title) => title.genres)
    titles: Title[]
}
