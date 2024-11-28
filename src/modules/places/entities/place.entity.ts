import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm'
import { ObjectType, Field, ID, Float } from '@nestjs/graphql'

@ObjectType()
@Entity('places')
export class Place {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Field()
    @Column()
    name: string

    @Field()
    @Column()
    country: string

    @Field()
    @Column()
    city: string

    @Field(() => Float)
    @Column('double precision')
    latitude: number

    @Field(() => Float)
    @Column('double precision')
    longitude: number

    @Field(() => [String])
    @Column('text', { array: true, default: [] })
    categories: string[]

    @Field()
    @Column()
    address: string

    @Field()
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date

    @Field()
    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date

    @Column('jsonb', { nullable: true })
    metadata?: Record<string, any>
}
