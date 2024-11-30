import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Title } from './title.entity'
import { Country } from './country.entity'

@Entity('certificates')
@Index('idx_certificates_title_country', ['title', 'country'], { unique: true })
@Index('idx_certificates_rating', ['rating'])
export class Certificate {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({ type: 'varchar', length: 20 })
    rating: string

    @ManyToOne(() => Title, (title) => title.certificates)
    @JoinColumn({ name: 'title_id' })
    title: Title

    @ManyToOne(() => Country, (country) => country.certificates)
    @JoinColumn({ name: 'country_id' })
    country: Country

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
