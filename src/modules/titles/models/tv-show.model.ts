import { ObjectType, Field, Int, Float } from '@nestjs/graphql'
import {
    Genre,
    ProductionCompany,
    ProductionCountry,
    SpokenLanguage,
    Network,
    SimplePerson,
} from './common.model'
import { TitleCategory } from '../enums/title-category.enum'
import { FilmingLocation } from '@/modules/locations/models/filming-location.model'

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

    @Field(() => [Genre])
    genres: Genre[]

    @Field({ nullable: true })
    homepage?: string

    @Field()
    inProduction: boolean

    @Field(() => [String])
    languages: string[]

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

    @Field()
    originalLanguage: string

    @Field(() => Float)
    popularity: number

    @Field(() => [ProductionCompany])
    productionCompanies: ProductionCompany[]

    @Field(() => [ProductionCountry])
    productionCountries: ProductionCountry[]

    @Field(() => [SpokenLanguage])
    spokenLanguages: SpokenLanguage[]

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

    @Field(() => [FilmingLocation], { nullable: true })
    filmingLocations?: FilmingLocation[]
}
