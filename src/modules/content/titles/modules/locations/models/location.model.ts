import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Point {
    @Field(() => Number, { nullable: true })
    latitude?: number

    @Field(() => Number, { nullable: true })
    longitude?: number
}

@ObjectType()
export class Location {
    @Field(() => String)
    id: string

    @Field(() => String)
    address: string

    @Field(() => Point, { nullable: true })
    coordinates?: Point

    @Field(() => String, { nullable: true })
    formattedAddress?: string

    @Field(() => Date, { nullable: true })
    createdAt?: Date

    @Field(() => Date, { nullable: true })
    updatedAt?: Date
}
