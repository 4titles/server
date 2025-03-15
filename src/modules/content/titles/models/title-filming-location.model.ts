import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'
import { Location } from '../modules/locations/models/location.model'
import { Title } from './title.model'

@ObjectType()
export class TitleFilmingLocation {
    @Field(() => String)
    id: string

    @Field(() => String)
    titleId: string

    @Field(() => String)
    locationId: string

    @Field(() => String)
    userId: string

    @Field(() => String, { nullable: true })
    description?: string

    @Field(() => Date, { nullable: true })
    createdAt?: Date

    @Field(() => Date, { nullable: true })
    updatedAt?: Date

    @Field(() => Location)
    location: Location

    @Field(() => User)
    user: User

    @Field(() => Title)
    title: Title
}
