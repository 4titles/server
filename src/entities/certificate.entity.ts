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
import { Country } from './country.entity'

@Entity('certificates')
@Index('idx_certificates_title_country', ['title', 'country'])
@Index('idx_certificates_rating', ['rating'])
export class Certificate {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({ type: 'varchar', length: 20 })
    rating: string

    @ManyToOne(() => Title, (title) => title.certificates, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'title_id' })
    title: Title

    @ManyToOne(() => Country, (country) => country.certificates, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'country_id' })
    country: Country

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date
}
