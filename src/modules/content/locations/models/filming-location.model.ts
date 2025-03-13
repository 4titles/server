import { ObjectType, Field } from '@nestjs/graphql'
import { Point } from './point.model'

@ObjectType()
export class FilmingLocation {
    @Field(() => String)
    address: string

    @Field(() => String, { nullable: true })
    formattedAddress?: string | null

    @Field(() => String, { nullable: true })
    description?: string | null

    @Field(() => Point, { nullable: true })
    coordinates?: Point
}
