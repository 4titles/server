import { ObjectType, Field, Int } from '@nestjs/graphql'
import { FilmingLocation } from './filming-location.model'

@ObjectType()
export class Location {
    @Field(() => Int)
    id: number

    @Field()
    address: string

    @Field(() => String, { nullable: true })
    latitude?: string

    @Field(() => String, { nullable: true })
    longitude?: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => [FilmingLocation], { nullable: true })
    filmingLocations?: FilmingLocation[]
}
