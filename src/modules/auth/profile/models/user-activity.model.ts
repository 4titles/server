import { User } from '@/modules/auth/account/models/user.model'
import { Collection } from '@/modules/content/collection/models/collection.model'
import { FilmingLocation } from '@/modules/content/title/modules/filming-location/models/filming-location.model'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class UserActivity {
    @Field(() => [FilmingLocation])
    filmingLocations: FilmingLocation[]

    @Field(() => [Collection])
    collections: Collection[]

    @Field(() => User)
    user: User

    @Field(() => String)
    periodStart: Date

    @Field(() => String)
    periodEnd: Date
}
