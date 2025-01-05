import { ObjectType, Field, Int } from '@nestjs/graphql'

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
export class MovieLanguages {
    @Field(() => [Language])
    original: Language[]

    @Field(() => [Language])
    spoken: Language[]
}

@ObjectType()
export class TvShowLanguages {
    @Field(() => [Language])
    original: Language[]

    @Field(() => [Language])
    spoken: Language[]

    @Field(() => [Language])
    available: Language[]
}
