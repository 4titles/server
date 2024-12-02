import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { Avatar } from './avatar.entity'
import { Title } from './title.entity'
import { Credit } from './credit.entity'

@Entity('names')
@Index('idx_names_imdb_id', ['imdbId'], { unique: true })
@Index('idx_names_display_name', ['displayName'])
@Index('idx_names_created_at', ['createdAt'])
export class Name {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({ name: 'imdb_id', type: 'varchar', length: 20 })
    imdbId: string

    @Column({
        name: 'display_name',
        type: 'varchar',
        length: 255,
        comment:
            'The primary name by which this person is known, usually the one by which they are most often credited.',
    })
    displayName: string

    @Column({ name: 'alternate_names', type: 'jsonb', nullable: true })
    alternateNames: string[]

    @Column({ name: 'birth_year', type: 'integer', nullable: true })
    birthYear: number

    @Column({ name: 'birth_location', type: 'varchar', nullable: true })
    birthLocation: string

    @Column({ name: 'death_year', type: 'integer', nullable: true })
    deathYear: number

    @Column({ name: 'death_location', type: 'varchar', nullable: true })
    deathLocation: string

    @Column({ name: 'dead_reason', type: 'varchar', nullable: true })
    deadReason: string

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date

    /** Relationships */

    @OneToMany(() => Avatar, (avatar) => avatar.name, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    avatars: Avatar[]

    @OneToMany(() => Credit, (credit) => credit.name, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    credits: Credit[]

    @ManyToMany(() => Title, (title) => title.knownForNames, {
        onDelete: 'CASCADE',
    })
    @JoinTable({
        name: 'names_known_for_titles',
        joinColumn: {
            name: 'name_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'title_id',
            referencedColumnName: 'id',
        },
    })
    knownFor: Title[]
}
