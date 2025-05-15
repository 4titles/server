import { User } from '@/modules/auth/account/models/user.model'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Title } from '../../title/models/title.model'
import { CommentableType } from '../enums/commentable-type.enum'
import { CommentLike } from './comment-like.model'

@ObjectType()
export class Comment {
    @Field(() => String)
    id: string

    @Field(() => String)
    userId: string

    @Field(() => String)
    commentableId: string

    @Field(() => String, { nullable: true })
    parentId?: string

    @Field(() => CommentableType)
    commentableType: CommentableType

    @Field(() => String)
    message: string

    @Field(() => User)
    user?: User

    @Field(() => Title, { nullable: true })
    title?: Partial<Title>

    @Field(() => Comment, { nullable: true })
    parent?: Comment

    @Field(() => [Comment])
    replies?: Comment[]

    @Field(() => [CommentLike], { nullable: true })
    likes?: CommentLike[]

    @Field(() => Int)
    likeCount: number

    @Field(() => Boolean)
    likedByMe: boolean

    @Field(() => Int, { defaultValue: 0 })
    totalReplies: number

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}
