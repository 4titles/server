import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class TmdbLanguage {
    @Field(() => String, { nullable: true })
    iso_639_1?: string

    @Field(() => String, { nullable: true })
    english_name?: string

    @Field(() => String, { nullable: true })
    name?: string
}
