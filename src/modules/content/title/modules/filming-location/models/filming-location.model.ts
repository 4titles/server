import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'
import { Country } from '../../country/models/country.model'

@ObjectType()
export class Point {
    @Field(() => Number, { nullable: true })
    x?: number

    @Field(() => Number, { nullable: true })
    y?: number
}

@ObjectType()
export class FilmingLocation {
    @Field(() => String)
    id: string

    @Field(() => String)
    address: string

    @Field(() => Point, { nullable: true })
    coordinates?: Point

    @Field(() => String, { nullable: true })
    formattedAddress?: string

    @Field(() => String, { nullable: true })
    placeId?: string

    @Field(() => String, { nullable: true })
    city?: string

    @Field(() => String, { nullable: true })
    state?: string

    @Field(() => String, { nullable: true })
    description?: string

    @Field(() => String, { nullable: true })
    enhancedDescription?: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => User, { nullable: true })
    user?: User

    @Field(() => Country)
    country: Country
}
