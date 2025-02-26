import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql'

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

    @Field(() => Boolean)
    isVerified: boolean

    @Field(() => Boolean)
    isTotpEnabled: boolean

    @Field(() => String, { nullable: true })
    totpSecret?: string

    @Field(() => GraphQLISODateTime)
    emailVerifiedAt: Date

    @Field(() => GraphQLISODateTime)
    createdAt: Date

    @Field(() => GraphQLISODateTime)
    updatedAt: Date
}
