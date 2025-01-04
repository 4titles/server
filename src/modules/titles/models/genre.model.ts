import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class GenreTranslations {
    @Field(() => String)
    en: string

    @Field(() => String)
    ru: string
}

@ObjectType()
export class Genre {
    @Field(() => Int)
    id?: number

    @Field(() => String)
    tmdbId: string

    @Field(() => GenreTranslations)
    names: GenreTranslations
}

@ObjectType()
export class MovieGenre {
    @Field(() => String)
    movieId: string

    @Field(() => Int)
    genreId: number

    @Field(() => Genre)
    genre: Genre
}

@ObjectType()
export class TvShowGenre {
    @Field(() => String)
    seriesId: string

    @Field(() => Int)
    genreId: number

    @Field(() => Genre)
    genre: Genre
}
