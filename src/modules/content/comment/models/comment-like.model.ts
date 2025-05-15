import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'
import { Comment } from './comment.model'

@ObjectType()
export class CommentLike {
    @Field(() => String)
    userId: string

    @Field(() => String)
    commentId: string

    @Field(() => User, { nullable: true })
    user?: User

    @Field(() => Comment, { nullable: true })
    comment?: Comment

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}
