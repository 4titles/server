import { ObjectType, Field } from '@nestjs/graphql'

@ObjectType()
export class GenreTranslations {
    @Field(() => String)
    en: string

    @Field(() => String)
    ru: string
}

@ObjectType()
export class Genre {
    @Field(() => String)
    id?: string

    @Field(() => String)
    tmdbId: string

    @Field(() => GenreTranslations)
    names: GenreTranslations
}

@ObjectType()
export class MovieGenre {
    @Field(() => String)
    movieId: string

    @Field(() => String)
    genreId: string

    @Field(() => Genre)
    genre: Genre
}

@ObjectType()
export class TvShowGenre {
    @Field(() => String)
    seriesId: string

    @Field(() => String)
    genreId: string

    @Field(() => Genre)
    genre: Genre
}
