import { FilmingLocation } from '@/modules/content/locations/models/filming-location.model'
import { Field, Float, Int, ObjectType } from '@nestjs/graphql'
import { TitleCategory } from '../enums/title-category.enum'
import {
    Network,
    ProductionCompany,
    ProductionCountry,
    SimplePerson,
} from './common.model'
import { Genre } from './genre.model'
import { TvShowLanguages } from './language.model'

@ObjectType()
export class TvShow {
    @Field(() => Int)
    tmdbId: number

    @Field(() => String, { nullable: true })
    imdbId?: string

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

    @Field(() => [Genre], { nullable: true })
    genres?: Genre[] | null

    @Field(() => TvShowLanguages, { nullable: true })
    languages?: TvShowLanguages
}
