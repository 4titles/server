import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Follow {
    @Field(() => String)
    id: string

    @Field(() => String)
    followerId: string

    @Field(() => String)
    followingId: string

    @Field(() => User)
    follower: User

    @Field(() => User)
    following: User

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}
