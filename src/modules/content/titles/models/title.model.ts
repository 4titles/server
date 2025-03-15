import { Field, ObjectType } from '@nestjs/graphql'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleStatus } from '../enums/title-status.enum'
import { TitleType } from '../enums/title-type.enum'
import { Comment } from './comment.model'
import { MovieDetails } from './movie-details.model'
import { SeriesDetails } from './series-details.model'
import { TitleCountry } from './title-country.model'
import { TitleFilmingLocation } from './title-filming-location.model'
import { TitleGenre } from './title-genre.model'
import { TitleLanguage } from './title-language.model'
import { TitleNetwork } from './title-network.model'
import { TitleProductionCompany } from './title-production-company.model'

@ObjectType()
export class Title {
    @Field(() => String)
    id: string

    @Field(() => String)
    name: string

    @Field(() => String, { nullable: true })
    originalName?: string

    @Field(() => TitleType)
    type: TitleType

    @Field(() => String)
    tmdbId: string

    @Field(() => String, { nullable: true })
    imdbId?: string

    @Field(() => Boolean)
    adult: boolean

    @Field(() => String, { nullable: true })
    posterPath?: string

    @Field(() => String, { nullable: true })
    backdropPath?: string

    @Field(() => String, { nullable: true })
    homepage?: string

    @Field(() => String)
    overview: string

    @Field(() => Number)
    popularity: number

    @Field(() => Number)
    voteAverage: number

    @Field(() => Number)
    voteCount: number

    @Field(() => TitleCategory)
    category: TitleCategory

    @Field(() => String, { nullable: true })
    tagLine?: string

    @Field(() => TitleStatus)
    status: TitleStatus

    @Field(() => Date, { nullable: true })
    createdAt?: Date

    @Field(() => Date, { nullable: true })
    updatedAt?: Date

    @Field(() => MovieDetails, { nullable: true })
    movieDetails?: MovieDetails

    @Field(() => SeriesDetails, { nullable: true })
    seriesDetails?: SeriesDetails

    @Field(() => [TitleFilmingLocation])
    filmingLocations?: TitleFilmingLocation[]

    @Field(() => [TitleGenre])
    titleGenres: TitleGenre[]

    @Field(() => [TitleLanguage])
    titleLanguages: TitleLanguage[]

    @Field(() => [TitleProductionCompany])
    titleProductionCompanies: TitleProductionCompany[]

    @Field(() => [TitleCountry])
    titleCountries: TitleCountry[]

    @Field(() => [TitleNetwork])
    titleNetworks: TitleNetwork[]

    @Field(() => [Comment])
    comments: Comment[]
}
