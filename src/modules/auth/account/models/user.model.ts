import { Field, ObjectType } from '@nestjs/graphql'

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

    @Field(() => String, { nullable: true })
    bio?: string

    @Field(() => Boolean)
    isVerified: boolean

    @Field(() => Boolean)
    isTotpEnabled: boolean

    @Field(() => String, { nullable: true })
    totpSecret?: string

    @Field(() => Boolean)
    isDeactivated: boolean

    @Field(() => Date, { nullable: true })
    deactivatedAt?: Date

    @Field(() => Date, { nullable: true })
    emailVerifiedAt?: Date

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}
