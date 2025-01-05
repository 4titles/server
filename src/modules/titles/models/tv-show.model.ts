import { ObjectType, Field, Int, Float } from '@nestjs/graphql'
import {
    ProductionCompany,
    ProductionCountry,
    Network,
    SimplePerson,
} from './common.model'
import { TitleCategory } from '../enums/title-category.enum'
import { FilmingLocation } from '@/modules/locations/models/filming-location.model'
import { Genre } from './genre.model'
import { TvShowLanguages } from './language.model'

@ObjectType()
export class TvShow {
    @Field(() => Int)
    tmdbId: number

    @Field(() => String)
    imdbId: string

    @Field()
    name: string

    @Field()
    originalName: string

    @Field()
    overview: string

    @Field({ nullable: true })
    posterPath?: string

    @Field({ nullable: true })
    backdropPath?: string

    @Field(() => [SimplePerson])
    createdBy: SimplePerson[]

    @Field(() => [Int])
    episodeRunTime: number[]

    @Field({ nullable: true })
    firstAirDate?: string

    @Field({ nullable: true })
    homepage?: string

    @Field()
    inProduction: boolean

    @Field({ nullable: true })
    lastAirDate?: string

    @Field(() => [Network])
    networks: Network[]

    @Field(() => Int)
    numberOfEpisodes: number

    @Field(() => Int)
    numberOfSeasons: number

    @Field(() => [String])
    originCountry: string[]

    @Field(() => Float)
    popularity: number

    @Field(() => [ProductionCompany])
    productionCompanies: ProductionCompany[]

    @Field(() => [ProductionCountry])
    productionCountries: ProductionCountry[]

    @Field()
    status: string

    @Field({ nullable: true })
    tagLine?: string

    @Field(() => Float)
    voteAverage: number

    @Field(() => Int)
    voteCount: number

    @Field(() => String, { nullable: true })
    updatedAt?: Date

    @Field(() => TitleCategory)
    category: TitleCategory

    // Relationships
    @Field(() => [FilmingLocation], { nullable: true })
    filmingLocations?: FilmingLocation[]

    @Field(() => [Genre, { nullable: true }])
    genres?: Genre[]

    @Field(() => TvShowLanguages, { nullable: true })
    languages?: TvShowLanguages
}
