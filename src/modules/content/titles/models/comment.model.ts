import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'
import { CommentableType } from '../enums/commentable-type.enum'
import { TitleFilmingLocation } from './title-filming-location.model'
import { Title } from './title.model'

@ObjectType()
export class Comment {
    @Field(() => String)
    id: string

    @Field(() => String)
    userId: string

    @Field(() => String, { nullable: true })
    titleId?: string

    @Field(() => String, { nullable: true })
    locationId?: string

    @Field(() => String, { nullable: true })
    parentId?: string

    @Field(() => String)
    content: string

    @Field(() => CommentableType)
    type: string

    @Field(() => Date, { nullable: true })
    createdAt?: Date

    @Field(() => Date, { nullable: true })
    updatedAt?: Date

    @Field(() => User)
    user: User

    @Field(() => Title)
    title: Title

    @Field(() => TitleFilmingLocation, { nullable: true })
    location?: TitleFilmingLocation

    @Field(() => Comment, { nullable: true })
    parent?: Comment

    @Field(() => [Comment])
    replies: Comment[]
}
