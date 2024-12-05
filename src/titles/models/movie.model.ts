import { ObjectType, Field, Int, Float } from '@nestjs/graphql'
import {
    Genre,
    ProductionCompany,
    ProductionCountry,
    SpokenLanguage,
} from './common.model'
import { TitleCategory } from '../enums/title-category.enum'
import { MovieStatus } from '../enums/movie-status.enum'

@ObjectType()
export class Movie {
    @Field(() => Int)
    tmdbId: number

    @Field()
    imdbId: string

    @Field()
    title: string

    @Field()
    originalTitle: string

    @Field()
    overview: string

    @Field({ nullable: true })
    posterPath?: string

    @Field({ nullable: true })
    backdropPath?: string

    @Field()
    adult: boolean

    @Field(() => Int)
    budget: number

    @Field(() => [Genre])
    genres: Genre[]

    @Field({ nullable: true })
    homepage?: string

    @Field()
    originalLanguage: string

    @Field(() => Float)
    popularity: number

    @Field({ nullable: true })
    releaseDate?: string

    @Field(() => Int)
    revenue: number

    @Field(() => Int)
    runtime: number

    @Field(() => MovieStatus)
    status: MovieStatus

    @Field({ nullable: true })
    tagLine?: string

    @Field(() => Float)
    voteAverage: number

    @Field(() => Int)
    voteCount: number

    @Field(() => [ProductionCompany])
    productionCompanies: ProductionCompany[]

    @Field(() => [ProductionCountry])
    productionCountries: ProductionCountry[]

    @Field(() => [SpokenLanguage])
    spokenLanguages: SpokenLanguage[]

    @Field(() => [String])
    originCountry: string[]

    @Field()
    updatedAt: string

    @Field(() => TitleCategory)
    category: TitleCategory
}
