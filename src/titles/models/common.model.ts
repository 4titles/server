import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class Genre {
    @Field(() => Int)
    id: number

    @Field()
    name: string
}

@ObjectType()
export class ProductionCompany {
    @Field(() => Int)
    id: number

    @Field()
    name: string

    @Field({ nullable: true })
    logo_path?: string

    @Field()
    origin_country: string
}

@ObjectType()
export class ProductionCountry {
    @Field()
    iso_3166_1: string

    @Field()
    name: string
}

@ObjectType()
export class SpokenLanguage {
    @Field()
    english_name: string

    @Field()
    iso_639_1: string

    @Field()
    name: string
}

@ObjectType()
export class CreatedBy {
    @Field(() => Int)
    id: number

    @Field()
    credit_id: string

    @Field()
    name: string

    @Field(() => Int)
    gender: number

    @Field({ nullable: true })
    profile_path?: string
}

@ObjectType()
export class Network {
    @Field(() => Int)
    id: number

    @Field()
    name: string

    @Field({ nullable: true })
    logo_path?: string

    @Field()
    origin_country: string
}
