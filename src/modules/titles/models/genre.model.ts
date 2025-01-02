import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class Genre {
    @Field(() => Int)
    tmdbId: number

    @Field(() => GenreTranslations)
    names: GenreTranslations[]

    @Field()
    updatedAt: Date
}

@ObjectType()
export class GenreTranslations {
    @Field(() => String)
    en: string

    @Field(() => String)
    ru: string
}
