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
import { Title } from './title.entity'
import { Certificate } from './certificate.entity'

@Entity('countries')
@Index('idx_countries_code', ['code'])
@Index('idx_countries_name', ['code', 'name'], { unique: true })
export class Country {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({
        type: 'varchar',
        length: 2,
        comment: 'ISO 3166-1 alpha-2 codes (two-letter).',
    })
    code: string

    @Column({
        type: 'varchar',
        length: 100,
        comment:
            'English short name officially used by the ISO 3166 Maintenance Agency (ISO 3166/MA)',
    })
    name: string

    @OneToMany(() => Certificate, (certificate) => certificate.country)
    certificates: Certificate[]

    @ManyToMany(() => Title, (title) => title.originCountries)
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
