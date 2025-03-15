import { Field, ObjectType } from '@nestjs/graphql'
import { Country } from './title-country.model'
import { Title } from './title.model'

@ObjectType()
export class ProductionCompany {
    @Field(() => String)
    id: string

    @Field(() => String, { nullable: true })
    tmdbId: string

    @Field(() => String)
    name: string

    @Field(() => String, { nullable: true })
    logoPath?: string

    @Field(() => String, { nullable: true })
    originCountryId?: string

    @Field(() => Country, { nullable: true })
    country?: Country
}

@ObjectType()
export class TitleProductionCompany {
    @Field(() => String)
    titleId: string

    @Field(() => String)
    productionCompanyId: string

    @Field(() => Title)
    title: Title

    @Field(() => ProductionCompany)
    productionCompany: ProductionCompany
}
