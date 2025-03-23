import { Field, ObjectType } from '@nestjs/graphql'
import { CountryRelation } from '../modules/country/enums/country-relation.enum'
import { Country } from '../modules/country/models/country.model'
import { Title } from './title.model'

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
