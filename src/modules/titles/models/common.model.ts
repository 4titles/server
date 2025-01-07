import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class ProductionCompany {
    @Field(() => Int, { nullable: true })
    id?: number

    @Field(() => String, { nullable: true })
    name?: string

    @Field({ nullable: true })
    logo_path?: string

    @Field({ nullable: true })
    origin_country?: string
}

@ObjectType()
export class ProductionCountry {
    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => String, { nullable: true })
    iso_3166_1?: string
}

@ObjectType()
export class SpokenLanguage {
    @Field(() => String, { nullable: true })
    iso_639_1?: string

    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => String, { nullable: true })
    english_name?: string
}

@ObjectType()
export class Network {
    @Field(() => Int, { nullable: true })
    id?: number

    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => String, { nullable: true })
    logo_path?: string

    @Field(() => String, { nullable: true })
    origin_country?: string
}

@ObjectType()
export class SimplePerson {
    @Field(() => Int, { nullable: true })
    id?: number

    @Field(() => String, { nullable: true })
    credit_id?: string

    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => Int, { nullable: true })
    gender?: number

    @Field(() => String, { nullable: true })
    profile_path?: string
}
