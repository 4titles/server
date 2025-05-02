import { Field, ObjectType } from '@nestjs/graphql'
import { Language } from '../../language/models/language.model'
import { FilmingLocation } from './filming-location.model'

@ObjectType()
export class FilmingLocationDescription {
    @Field(() => String)
    id: string

    @Field(() => String)
    filmingLocationId: string

    @Field(() => FilmingLocation, { nullable: true })
    filmingLocation?: FilmingLocation

    @Field(() => String)
    languageId: string

    @Field(() => Language, { nullable: true })
    language?: Language

    @Field()
    description: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}
