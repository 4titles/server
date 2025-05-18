import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'
import { Collection } from '../../collection/models/collection.model'
import { Title } from '../../title/models/title.model'
import { FilmingLocation } from '../../title/modules/filming-location/models/filming-location.model'
import { FavorableType } from '../enums/favorable-type.enum'

@ObjectType()
export class Favorite {
    @Field(() => String)
    id: string

    @Field(() => String)
    userId: string

    @Field(() => FavorableType)
    favorableType: FavorableType

    @Field(() => String)
    favorableId: string

    @Field(() => String, { nullable: true })
    contextId?: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => User, { nullable: true })
    user?: User

    @Field(() => Title, { nullable: true })
    title?: Title

    @Field(() => FilmingLocation, { nullable: true })
    filmingLocation?: FilmingLocation

    @Field(() => Title, { nullable: true })
    contextTitle?: Title

    @Field(() => Collection, { nullable: true })
    collection?: Collection
}
