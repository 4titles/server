import { Field, ObjectType } from '@nestjs/graphql'
import { Country } from './title-country.model'
import { Title } from './title.model'

@ObjectType()
export class Network {
    @Field(() => String)
    id: string

    @Field(() => String, { nullable: true })
    tmdbId?: string

    @Field(() => String)
    name: string

    @Field(() => String, { nullable: true })
    logoPath?: string

    @Field(() => String, { nullable: true })
    originCountryId?: string

    @Field(() => [TitleNetwork])
    titleNetworks: TitleNetwork[]

    @Field(() => Country, { nullable: true })
    originCountry?: Country
}

@ObjectType()
export class TitleNetwork {
    @Field(() => String)
    titleId: string

    @Field(() => String)
    networkId: string

    @Field(() => Title)
    title: Title

    @Field(() => Network)
    network: Network
}
