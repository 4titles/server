import { Field, ObjectType } from '@nestjs/graphql'
import { CountryRelation } from '../enums/country-relation.enum'
import { Title } from './title.model'

@ObjectType()
export class Country {
    @Field(() => String)
    id: string

    @Field(() => String)
    iso: string

    @Field(() => String)
    englishName: string

    @Field(() => String, { nullable: true })
    nativeName?: string
}

@ObjectType()
export class TitleCountry {
    @Field(() => String)
    titleId: string

    @Field(() => String)
    countryId: string

    @Field(() => CountryRelation)
    type: CountryRelation

    @Field(() => Title)
    title: Title

    @Field(() => Country)
    country: Country
}
