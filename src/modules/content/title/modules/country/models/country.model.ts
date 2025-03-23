import { Field, ObjectType } from '@nestjs/graphql'
import { TitleCountry } from '../../../models/title-country.model'

@ObjectType()
export class Country {
    @Field(() => String)
    id: string

    @Field(() => String)
    iso: string

    @Field(() => String)
    englishName: string

    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => [TitleCountry], { nullable: true })
    titles?: TitleCountry[]
}
