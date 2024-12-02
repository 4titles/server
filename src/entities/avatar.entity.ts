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
        default:
            'https://png.pngtree.com/png-clipart/20210129/ourmid/pngtree-default-male-avatar-png-image_2811083.jpg',
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

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt: Date

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt: Date
}
