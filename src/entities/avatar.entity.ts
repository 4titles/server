import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { Name } from './name.entity'

@Entity('avatars')
@Index('idx_avatars_name_url', ['name', 'url'], { unique: true })
export class Avatar {
    @PrimaryGeneratedColumn('increment')
    id: number

    @Column({
        type: 'varchar',
        length: 255,
        comment: 'The direct address of avatar.',
    })
    url: string

    @Column({
        type: 'integer',
        nullable: true,
        comment: "The avatar's width in pixels",
    })
    width: number

    @Column({
        type: 'integer',
        nullable: true,
        comment: "The avatar's height in pixels",
    })
    height: number

    @ManyToOne(() => Name, (name) => name.avatars, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'name_id' })
    name: Name

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
