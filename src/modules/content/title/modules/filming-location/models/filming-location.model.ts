import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'
import { TitleFilmingLocation } from '../../../models/title-filming-location.model'
import { Country } from '../../country/models/country.model'
import { FilmingLocationDescription } from './filming-location-description.model'

@ObjectType()
export class Point {
    @Field(() => Number, { nullable: true })
    x?: number

    @Field(() => Number, { nullable: true })
    y?: number
}

@ObjectType()
export class FilmingLocation {
    @Field(() => String)
    id: string

    @Field(() => String)
    address: string

    @Field(() => Point, { nullable: true })
    coordinates?: Point

    @Field(() => String, { nullable: true })
    formattedAddress?: string

    @Field(() => String, { nullable: true })
    placeId?: string

    @Field(() => String, { nullable: true })
    city?: string

    @Field(() => String, { nullable: true })
    state?: string

    @Field(() => String, { nullable: true })
    description?: string

    @Field(() => [FilmingLocationDescription], { nullable: true })
    descriptions?: FilmingLocationDescription[]

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => User, { nullable: true })
    user?: User

    @Field(() => Country)
    country: Country

    @Field(() => [TitleFilmingLocation], { nullable: true })
    titleFilmingLocations?: TitleFilmingLocation[]
}
