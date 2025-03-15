import { Field, ObjectType } from '@nestjs/graphql'
import { Title } from './title.model'

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
    id: string

    @Field(() => String)
    tmdbId: string

    @Field(() => GenreTranslations)
    names: GenreTranslations
}

@ObjectType()
export class TitleGenre {
    @Field(() => String)
    titleId: string

    @Field(() => String)
    genreId: string

    @Field(() => Title)
    title: Title

    @Field(() => Genre)
    genre: Genre
}
