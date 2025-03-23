import { Field, ObjectType } from '@nestjs/graphql'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleStatus } from '../enums/title-status.enum'
import { TitleType } from '../enums/title-type.enum'
import { Comment } from './comment.model'
import { TitleCountry } from './title-country.model'
import { TitleDetails } from './title-details.model'
import { TitleFilmingLocation } from './title-filming-location.model'
import { TitleGenre } from './title-genre.model'
import { TitleLanguage } from './title-language.model'

@ObjectType()
export class TitleOverview {
    @Field(() => String)
    en: string

    @Field(() => String, { nullable: true })
    ru?: string
}

@ObjectType()
export class Title {
    @Field(() => String)
    id: string

    @Field(() => String)
    tmdbId: string

    @Field(() => String, { nullable: true })
    imdbId?: string

    @Field(() => String)
    name: string

    @Field(() => String, { nullable: true })
    originalName?: string

    @Field(() => TitleType)
    type: TitleType

    @Field(() => TitleCategory)
    category: TitleCategory

    @Field(() => TitleStatus)
    status: TitleStatus

    @Field(() => Boolean)
    isAdult: boolean

    @Field(() => String, { nullable: true })
    posterPath?: string

    @Field(() => String, { nullable: true })
    backdropPath?: string

    @Field(() => TitleOverview)
    overview: TitleOverview

    @Field(() => Number)
    popularity: number

    @Field(() => Boolean)
    needsLocationUpdate: boolean

    @Field(() => TitleDetails, { nullable: true })
    details?: TitleDetails

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => Date, { nullable: true })
    lastSyncedAt?: Date

    @Field(() => [TitleFilmingLocation])
    filmingLocations?: TitleFilmingLocation[]

    @Field(() => [Comment])
    comments: Comment[]

    @Field(() => [TitleGenre])
    genres: TitleGenre[]

    @Field(() => [TitleLanguage])
    languages: TitleLanguage[]

    @Field(() => [TitleCountry])
    countries: TitleCountry[]
}
