import { ObjectType, Field, Int, Float } from '@nestjs/graphql'
import { ProductionCompany, ProductionCountry } from './common.model'
import { TitleCategory } from '../enums/title-category.enum'
import { MovieStatus } from '../enums/movie-status.enum'
import { FilmingLocation } from '@/modules/locations/models/filming-location.model'
import { Genre } from './genre.model'
import { MovieLanguages } from './language.model'

@ObjectType()
export class Movie {
    @Field(() => Int)
    tmdbId: number

    @Field(() => String, { nullable: true })
    imdbId?: string

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

    @Field({ nullable: true })
    homepage?: string

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

    @Field(() => [String])
    originCountry: string[]

    @Field(() => String, { nullable: true })
    updatedAt: Date

    @Field(() => TitleCategory)
    category: TitleCategory

    // Relationships
    @Field(() => [FilmingLocation], { nullable: true })
    filmingLocations?: FilmingLocation[]

    @Field(() => [Genre], { nullable: true })
    genres?: Genre[] | null

    @Field(() => MovieLanguages, { nullable: true })
    languages?: MovieLanguages
}
