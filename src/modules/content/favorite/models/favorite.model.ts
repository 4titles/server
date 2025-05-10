import { Field, ObjectType } from '@nestjs/graphql'
import { User } from '../../../auth/account/models/user.model'
import { Title } from '../../title/models/title.model'
import { FilmingLocation } from '../../title/modules/filming-location/models/filming-location.model'
import { FavoriteType } from '../enums/favorite-type.enum'

@ObjectType()
export class Favorite {
    @Field(() => String)
    id: string

    @Field(() => String)
    userId: string

    @Field(() => FavoriteType)
    type: FavoriteType

    @Field(() => String, { nullable: true })
    titleId?: string

    @Field(() => String, { nullable: true })
    filmingLocationId?: string

    @Field(() => String, { nullable: true })
    filmingLocationTitleId?: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => User)
    user: User

    @Field(() => Title, { nullable: true })
    title?: Title

    @Field(() => FilmingLocation, { nullable: true })
    filmingLocation?: FilmingLocation

    @Field(() => Title, { nullable: true })
    filmingLocationTitle?: Title
}
