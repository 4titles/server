import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Country } from './country.model'

@ObjectType()
export class CountryStatistics extends Country {
    @Field(() => Int)
    moviesCount: number

    @Field(() => Int)
    seriesCount: number

    @Field(() => Int)
    locationsCount: number
}
