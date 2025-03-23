import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class TmdbCountry {
    @Field(() => String, { nullable: true })
    iso_3166_1?: string

    @Field(() => String, { nullable: true })
    english_name?: string

    @Field(() => String, { nullable: true })
    native_name?: string
}
