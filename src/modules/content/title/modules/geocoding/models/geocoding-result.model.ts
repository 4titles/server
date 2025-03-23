import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class GeocodingResult {
    @Field(() => Number)
    lat: number

    @Field(() => Number)
    lon: number

    @Field(() => String)
    formattedAddress: string

    @Field(() => Number)
    confidence: number

    @Field(() => String, { nullable: true })
    city?: string

    @Field(() => String, { nullable: true })
    state?: string

    @Field(() => String, { nullable: true })
    street?: string

    @Field(() => String)
    placeId: string

    @Field(() => String, { nullable: true })
    resultType?: string

    @Field(() => String)
    countryCode: string
}
