import { ObjectType, Field } from '@nestjs/graphql'

@ObjectType()
export class FilmingLocation {
    @Field(() => String)
    address: string

    @Field(() => String, { nullable: true })
    description?: string | null

    @Field(() => String, { nullable: true })
    latitude?: string | null

    @Field(() => String, { nullable: true })
    longitude?: string | null
}
