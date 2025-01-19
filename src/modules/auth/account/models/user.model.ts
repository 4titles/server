import { ObjectType, Field, GraphQLISODateTime } from '@nestjs/graphql'

@ObjectType()
export class User {
    @Field(() => String)
    id: string

    @Field(() => String)
    email: string

    @Field(() => String)
    password: string

    @Field(() => String)
    username: string

    @Field(() => String, { nullable: true })
    displayName?: string

    @Field(() => String, { nullable: true })
    avatar?: string

    @Field(() => GraphQLISODateTime)
    createdAt: Date

    @Field(() => GraphQLISODateTime)
    updatedAt: Date
}
