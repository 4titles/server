import { User } from '@/modules/auth/account/models/user.model'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Comment } from '../../comment/models/comment.model'
import { Favorite } from '../../favorite/models/favorite.model'
import { CollectionType } from '../enums/collection-type.enum'
import { LocationCollectionItem } from './location-collection-item.model'
import { TitleCollectionItem } from './title-collection-item.model'

@ObjectType()
export class Collection {
    @Field(() => String)
    id: string

    @Field(() => String)
    title: string

    @Field(() => String, { nullable: true })
    description?: string

    @Field(() => String)
    slug: string

    @Field(() => String, { nullable: true })
    coverImageUrl?: string

    @Field(() => Boolean)
    isPrivate: boolean

    @Field(() => CollectionType)
    type: CollectionType

    @Field(() => String)
    userId: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => Int)
    itemsCount: number

    @Field(() => Int)
    favoritesCount: number

    @Field(() => Int)
    commentsCount: number

    @Field(() => Boolean)
    isFavorite: boolean

    @Field(() => String, { nullable: true })
    coverImage?: string

    @Field(() => User)
    user: User

    @Field(() => [Favorite])
    favorites: Favorite[]

    @Field(() => [Comment])
    comments: Comment[]

    @Field(() => [TitleCollectionItem])
    titleItems: TitleCollectionItem[]

    @Field(() => [LocationCollectionItem])
    locationItems: LocationCollectionItem[]
}
