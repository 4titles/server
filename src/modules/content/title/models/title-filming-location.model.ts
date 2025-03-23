import { Field, ObjectType } from '@nestjs/graphql'
import { FilmingLocation } from '../modules/filming-location/models/filming-location.model'
import { Title } from './title.model'

@ObjectType()
export class TitleFilmingLocation {
    @Field(() => String)
    id: string

    @Field(() => String)
    titleId: string

    @Field(() => String)
    filmingLocationId: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => Title)
    title: Title

    @Field(() => FilmingLocation)
    filmingLocation: FilmingLocation
}
