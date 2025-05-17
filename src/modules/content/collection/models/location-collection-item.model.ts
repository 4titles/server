import { Field, Int, ObjectType } from '@nestjs/graphql'
import { FilmingLocation } from '../../title/modules/filming-location/models/filming-location.model'
import { Collection } from './collection.model'

@ObjectType()
export class LocationCollectionItem {
    @Field(() => String)
    id: string

    @Field(() => String)
    collectionId: string

    @Field(() => String)
    locationId: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Int)
    position: number

    @Field(() => Collection)
    collection: Collection

    @Field(() => FilmingLocation)
    location: FilmingLocation
}
