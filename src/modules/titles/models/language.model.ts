import { ObjectType, Field, Int } from '@nestjs/graphql'
import { MovieLanguageType } from '../enums/movie-language-type.enum'
import { SeriesLanguageType } from '../enums/series-language-type.enum'

@ObjectType()
export class Language {
    @Field(() => Int, { nullable: true })
    id?: number

    @Field(() => String)
    iso: string

    @Field(() => String)
    englishName: string

    @Field({ nullable: true })
    name?: string
}

@ObjectType()
export class MovieLanguage {
    @Field(() => Language)
    language: Language

    @Field(() => MovieLanguageType)
    type: MovieLanguageType
}

@ObjectType()
export class SeriesLanguage {
    @Field(() => Language)
    language: Language

    @Field(() => SeriesLanguageType)
    type: SeriesLanguageType
}
